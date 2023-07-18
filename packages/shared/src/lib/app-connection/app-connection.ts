import { BaseModel } from "../common/base-model";
import { OAuth2AuthorizationMethod } from "./oauth2-authorization-method";

export type AppConnectionId = string;

export enum AppConnectionStatus {
  EXPIRED = "EXPIRED",
  ACTIVE = "ACTIVE",
  ERROR = "ERROR"
}

interface BaseAppConnection<S> extends BaseModel<AppConnectionId> {
  name: string;
  appName: string;
  projectId: string;
  value: S;
  status: AppConnectionStatus;
}

export enum AppConnectionType {
  OAUTH2 = "OAUTH2",
  CLOUD_OAUTH2 = "CLOUD_OAUTH2",
  SECRET_TEXT = "SECRET_TEXT",
  BASIC_AUTH = "BASIC_AUTH",
  CUSTOM_AUTH ="CUSTOM_AUTH"
}

export interface SecretTextConnectionValue {
  type: AppConnectionType.SECRET_TEXT,
  secret_text: string;
}
export interface BasicAuthConnectionValue {
  username: string;
  password: string;
  type: AppConnectionType.BASIC_AUTH
}

export interface BaseOAuth2ConnectionValue {
  expires_in: number;
  token_type: string;
  access_token: string;
  claimed_at: number;
  refresh_token: string;
  scope: string;
  authorization_method?: OAuth2AuthorizationMethod,
  data: Record<string, any>
}

export interface CustomAuthConnectionValue
{
  type: AppConnectionType.CUSTOM_AUTH;
  props: Record<string, unknown>;
}

export interface CloudOAuth2ConnectionValue extends BaseOAuth2ConnectionValue {
  type: AppConnectionType.CLOUD_OAUTH2;
  client_id: string;
  expires_in: number;
  token_type: string;
  access_token: string;
  claimed_at: number;
  refresh_token: string;
  scope: string;
  data: Record<string, any>
  props?: Record<string, any>;
  token_url?: string;
}

export interface OAuth2ConnectionValueWithApp extends BaseOAuth2ConnectionValue {
  type: AppConnectionType.OAUTH2;
  client_id: string;
  client_secret: string;
  token_url: string;
  redirect_url: string;
  props?: Record<string, any>;
}


export type OAuth2AppConnection = BaseAppConnection<OAuth2ConnectionValueWithApp>;
export type SecretKeyAppConnection = BaseAppConnection<SecretTextConnectionValue>;
export type CloudAuth2Connection = BaseAppConnection<CloudOAuth2ConnectionValue>;
export type BasicAuthConnection = BaseAppConnection<BasicAuthConnectionValue>;
export type CustomAuthConnection = BaseAppConnection<CustomAuthConnectionValue>;
export type AppConnection = BasicAuthConnection | SecretKeyAppConnection | OAuth2AppConnection | CloudAuth2Connection | CustomAuthConnection;
export type AppConnectionValue = SecretTextConnectionValue | OAuth2ConnectionValueWithApp | CloudOAuth2ConnectionValue | BasicAuthConnectionValue | CustomAuthConnectionValue;