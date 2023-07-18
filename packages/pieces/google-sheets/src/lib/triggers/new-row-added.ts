import { createTrigger } from '@activepieces/pieces-framework';
import { TriggerStrategy } from "@activepieces/pieces-framework";
import { googleSheetsCommon } from '../common/common';

const alphabet ='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const sampleData = Array.from(alphabet).map(c=>`${c} Value`);
Array.from(alphabet).forEach(c=>sampleData.push(`${c}${c} Value`));
export const newRowAdded = createTrigger({
  name: 'new_row_added',
  displayName: 'New Row',
  description: 'Triggers when there is a new row added',
  props: {
    authentication: googleSheetsCommon.authentication,
    spreadsheet_id: googleSheetsCommon.spreadsheet_id,
    sheet_id: googleSheetsCommon.sheet_id
  },
  sampleData: {
    "value": sampleData,
    "rowId": 1
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    const sheetId = context.propsValue['sheet_id'];
    const accessToken = context.propsValue['authentication']['access_token'];
    const spreadSheetId = context.propsValue['spreadsheet_id'];
    const allValues =  await googleSheetsCommon.getValues(spreadSheetId, accessToken, sheetId);    
    if(!allValues)
    {
      return [];
    }
    return allValues.slice(Math.max(allValues.length-5,0));
  },
  async onEnable(context) {
    const sheetId = context.propsValue['sheet_id'];
    const accessToken = context.propsValue['authentication']['access_token'];
    const spreadSheetId = context.propsValue['spreadsheet_id'];
    const currentValues = await googleSheetsCommon.getValues(spreadSheetId, accessToken, sheetId);
    console.log(`The spreadsheet ${spreadSheetId} started with ${currentValues.length} rows`);
    context.store?.put("rowCount", currentValues.length);
  },
  async onDisable(context) {
    console.log("Disabling new google sheets trigger");
   },
   async run(context) {
    const sheetId = context.propsValue['sheet_id'];
    const accessToken = context.propsValue['authentication']['access_token'];
    const spreadSheetId = context.propsValue['spreadsheet_id'];
    const rowCount = (await context.store?.get<number>("rowCount")) ?? 0;
    const currentValues = await googleSheetsCommon.getValues(spreadSheetId, accessToken, sheetId)
    let payloads: unknown[] = [];
    console.log(`The spreadsheet ${spreadSheetId} has now ${currentValues.length} rows, previous # of rows ${rowCount}`);
    if (currentValues.length > rowCount) {
      payloads = currentValues.slice(rowCount).map((value, index) => {
        const rowIndex = rowCount + index;
        return {
          value: value,
          rowId: rowIndex
        }
      });
    }
    context.store?.put("rowCount", currentValues.length);
    return payloads;
},
});

