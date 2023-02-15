/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import MockAdapter from "axios-mock-adapter";
import { TFEClient, WorkspaceShowResponse } from "./client";

export interface MockTFEClient {
  client: TFEClient;
  adapter: MockAdapter;
}

export const newMockTFEClient = (): MockTFEClient => {
  const client = new TFEClient("terraform.mock", "foobar");
  const adapter = new MockAdapter(Reflect.get(client, "_client"));
  const fixtureWorkspace =
    require("./test-fixtures/read-workspace.json") as WorkspaceShowResponse;

  adapter
    .onGet(
      `https://terraform.mock/api/v2/organizations/hashicorp/workspaces/foobar`
    )
    .reply(200, require("./test-fixtures/read-workspace.json"));

  adapter
    .onGet(
      `https://terraform.mock/api/v2/workspaces/${fixtureWorkspace.data.id}/current-state-version`
    )
    .reply(200, require("./test-fixtures/sv-with-outputs.json"));

  return {
    client,
    adapter,
  };
};

describe("TFE Client", () => {
  let mockClient: MockTFEClient;

  beforeAll(() => {
    mockClient = newMockTFEClient();
  });

  test("returns workspace when fetched with org name pair", done => {
    const expected = require("./test-fixtures/read-workspace.json");

    mockClient.client.readWorkspace("hashicorp", "foobar").then(workspace => {
      expect(workspace.data.id).toEqual(expected.data.id);
      done();
    });
  });

  test("returns outputs when latest state version is read from workspace", done => {
    const expectedOutputNames = ["foo", "bar", "foobar"];
    const fixtureWorkspace =
      require("./test-fixtures/read-workspace.json") as WorkspaceShowResponse;

    mockClient.client.readCurrentStateVersion(fixtureWorkspace).then(sv => {
      expect(sv.included.length).toEqual(expectedOutputNames.length);
      sv.included.forEach(output => {
        expect(expectedOutputNames).toContain(output.attributes.name);
        expect(output.attributes.value).toBeDefined();
      });
      done();
    });
  });
});
