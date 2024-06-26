/**
 * This file was auto-generated by openapi-typescript.
 * Do not make direct changes to the file.
 */


export interface paths {
  "/tags/{objectId}": {
    /** Get a tag by ID */
    get: {
      parameters: {
        path: {
          objectId: string;
        };
      };
      responses: {
        /** @description OK */
        200: {
          content: {
            "application/json": components["schemas"]["Tag"];
          };
        };
      };
    };
    /** Create a new tag */
    post: {
      requestBody: {
        content: {
          "application/json": components["schemas"]["Tag"];
        };
      };
      responses: {
        /** @description Created */
        201: {
          content: {
            "application/json": components["schemas"]["Tag"];
          };
        };
        /** @description Not Found */
        404: {
          content: {
            "application/json": components["schemas"]["Error"];
          };
        };
        /** @description Conflict */
        409: {
          content: {
            "application/json": components["schemas"]["Error"];
          };
        };
      };
    };
  };
}

export type webhooks = Record<string, never>;

export type components = Record<string, never>;

export type $defs = Record<string, never>;

export type external = Record<string, never>;

export type operations = Record<string, never>;
