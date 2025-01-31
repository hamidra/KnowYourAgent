export type AgentMetadata = { remote: boolean; did?: string; name?: string };

export type ResponseMetadata = {
  agent: AgentMetadata;
};
export type HumanActionWithOrigin = {
  action: HumanAction;
  from?: AgentMetadata;
};

export type ActionMetadata = {
  name: string;
  description: string;
  title: string;
  btnText?: string;
  logo: string;
};

export type HumanAction = {
  url: string;
  metadata: ActionMetadata;
  /*
  // ToDo: add more fields to create generic http actions
  
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers: Record<string, string>;
  bodySchema: Schema;
  parameters: Record<string, Parameter>;
  */
};
