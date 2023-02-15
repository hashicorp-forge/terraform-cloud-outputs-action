/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import axios, { AxiosInstance } from "axios";
import axiosRetry from "axios-retry";
import * as querystring from "querystring";

export type StateVersionOutputData = {
  id: string;
  type: string;
  attributes: {
    name: string;
    sensitive: boolean;
    type: string;
    value: any;
  };
};

export type CurrentStateVersionWithOutputsResponse = {
  data: {
    id: string;
    type: string;
    attributes: {
      "resources-processed": boolean;
    };
  };
  included: StateVersionOutputData[];
};

export type WorkspaceShowData = {
  id: string;
  type: string;
  relationships: {
    "current-state-version": {
      links: {
        related: string;
      };
    };
  };
};

export type WorkspaceShowResponse = {
  data: WorkspaceShowData;
};

export class TFEClient {
  private _client: AxiosInstance;

  constructor(hostname: string, token: string) {
    this._client = axios.create({
      baseURL: `https://${hostname}`,
      timeout: 30000,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
      },
    });
    axiosRetry(this._client, {
      retries: 3,
      retryDelay: axiosRetry.exponentialDelay,
    });
  }

  public async readWorkspace(
    organization: string,
    workspace: string
  ): Promise<WorkspaceShowResponse> {
    try {
      const path = `/api/v2/organizations/${querystring.escape(
        organization
      )}/workspaces/${querystring.escape(workspace)}`;
      const workspaceResponse = await this._client.get<WorkspaceShowResponse>(
        path
      );

      return workspaceResponse.data;
    } catch (err) {
      throw new Error(`Failed to read workspace: ${err.message}`);
    }
  }

  public async readCurrentStateVersion(
    workspaceResponse: WorkspaceShowResponse
  ): Promise<CurrentStateVersionWithOutputsResponse> {
    const path =
      workspaceResponse.data.relationships["current-state-version"].links
        .related;

    try {
      const outputsResponse =
        await this._client.get<CurrentStateVersionWithOutputsResponse>(path, {
          params: {
            include: "outputs",
          },
        });

      return outputsResponse.data;
    } catch (err) {
      throw new Error(`Failed to read ${path}: ${err.message}`);
    }
  }
}
