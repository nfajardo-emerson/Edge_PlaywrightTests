import { test, expect } from "@playwright/test";
import { getAccessToken } from "../helpers/auth";

type Endpoint = {
  swaggerOperation: string;
  method: string;
  requestUrl: string;
  operationId: string;
  parameters?: {
    name: string;
    in: string;
    value: string | undefined;
  }[];
  requestBody?: Record<string, string | undefined>;
};

const endpoints: Endpoint[] = [
  {
    swaggerOperation: "get /api/v3/ae",
    method: "GET",
    requestUrl: process.env.EDGE_API_BASE_URL + "/api/v3/ae",
    operationId: "#operations-Ae-GetDistinctAlarmsEventsV3",
  },
  {
    swaggerOperation: "get /api/v1/batchevent",
    method: "GET",
    requestUrl: process.env.EDGE_API_BASE_URL + "/api/v1/batchevent",
    operationId: "#operations-BatchEvent-get_api_v1_batchevent",
  },
  {
    swaggerOperation: "post /api/v1/bulk/history",
    method: "POST",
    requestUrl: process.env.EDGE_API_BASE_URL + "/api/v1/bulk/history",
    operationId: "#operations-Bulk-post_api_v1_bulk_history",
  },
  {
    swaggerOperation: "post /api/v1/bulk/runtime",
    method: "POST",
    requestUrl: process.env.EDGE_API_BASE_URL + "/api/v1/bulk/runtime",
    operationId: "#operations-Bulk-post_api_v1_bulk_runtime",
  },
  {
    swaggerOperation: "get /api/v1/graph",
    method: "GET",
    requestUrl: process.env.EDGE_API_BASE_URL + "/api/v1/graph",
    operationId: "#operations-Graph-GetGraphRoot",
  },
  {
    swaggerOperation: "get /api/v1/graph/{id}",
    method: "GET",
    requestUrl:
      process.env.EDGE_API_BASE_URL +
      `/api/v1/graph/${process.env.DV_SYSTEM_ID}`,
    operationId: "#operations-Graph-GetEntitiesV1",
    parameters: [
      {
        name: "id",
        in: "path",
        value: process.env.DV_SYSTEM_ID,
      },
    ],
  },
  {
    swaggerOperation: "get /api/v2/graph",
    method: "GET",
    requestUrl: process.env.EDGE_API_BASE_URL + "/api/v2/graph",
    operationId: "#operations-Graph-GetGraphRoot_v2",
  },
  {
    swaggerOperation: "get /api/v2/graph/{id}",
    method: "GET",
    requestUrl:
      process.env.EDGE_API_BASE_URL +
      `/api/v2/graph/${process.env.DV_SYSTEM_ID}`,
    operationId: "#operations-Graph-GetEntitiesV2",
    parameters: [
      {
        name: "id",
        in: "path",
        value: process.env.DV_SYSTEM_ID,
      },
    ],
  },
  {
    swaggerOperation: "get /api/v2/graph/search",
    method: "GET",
    requestUrl: process.env.EDGE_API_BASE_URL + `/api/v2/graph/search`,
    operationId: "#operations-Graph-get_api_v2_graph_search",
    parameters: [
      {
        name: "q",
        in: "query",
        value: "alm",
      },
      {
        name: "type",
        in: "query",
        value: "parameter",
      },
    ],
  },
  {
    swaggerOperation: "get /api/v1/history",
    method: "GET",
    requestUrl: process.env.EDGE_API_BASE_URL + `/api/v1/history`,
    operationId: "#operations-History-get_api_v1_history",
    parameters: [
      {
        name: "id",
        in: "query",
        value: process.env.DV_PARAMETER_ID,
      },
      {
        name: "p",
        in: "query",
        value: "CV",
      },
    ],
  },
  {
    swaggerOperation: "get /api/v1/history/{id}",
    method: "GET",
    requestUrl:
      process.env.EDGE_API_BASE_URL +
      `/api/v1/history/${process.env.DV_PARAMETER_ID}`,
    operationId: "#operations-History-get_api_v1_history__id_",
    parameters: [
      {
        name: "id",
        in: "path",
        value: process.env.DV_PARAMETER_ID,
      },
      {
        name: "p",
        in: "query",
        value: "CV",
      },
    ],
  },
  {
    swaggerOperation: "get /api/v1/login/currentaccount",
    method: "GET",
    requestUrl: process.env.EDGE_API_BASE_URL + "/api/v1/login/currentaccount",
    operationId: "#operations-Login-CurrentAccount",
  },
  {
    swaggerOperation: "get /api/v1/login/isadmin",
    method: "GET",
    requestUrl: process.env.EDGE_API_BASE_URL + "/api/v1/login/isadmin",
    operationId: "#operations-Login-IsAdmin",
  },
  {
    swaggerOperation: "post /api/v1/login/getauthtoken/{method}",
    method: "POST",
    requestUrl:
      process.env.EDGE_API_BASE_URL + "/api/v1/login/getauthtoken/profile",
    operationId: "#operations-Login-GetAuthToken",
    parameters: [
      {
        name: "method",
        in: "path",
        value: "profile",
      },
    ],
    requestBody: {
      Username: process.env.EDGE_USERNAME,
      Password: process.env.EDGE_PASSWORD,
    },
  },
];

endpoints.forEach((endpoint) => {
  const { swaggerOperation, method, requestUrl, parameters, requestBody } =
    endpoint;
  test(`${swaggerOperation}`, async ({ page }) => {
    test.setTimeout(90_000);

    const token = await getAccessToken();

    await test.step("Open Swagger and sign in", async () => {
      await page.goto(process.env.EDGE_SWAGGER_URL as string);
      await page.getByRole("button", { name: "Authorize" }).click();
      await page
        .getByRole("textbox", { name: "auth-bearer-value" })
        .fill(token);
      await page.getByRole("button", { name: "Apply credentials" }).click();
      await page.getByRole("button", { name: "Close" }).click();
    });

    const operation = page.locator(".opblock").filter({
      has: page.getByRole("button", { name: swaggerOperation, exact: true }),
    });
    await test.step(`Choose the ${swaggerOperation} endpoint`, async () => {
      await expect(operation.describe("Selected API endpoint")).toHaveCount(1);
      await operation
        .getByRole("button", { name: swaggerOperation, exact: true })
        .click();
      await operation.getByRole("button", { name: "Try it out" }).click();
    });

    await test.step("Enter the request parameters", async () => {
      for (const parameter of parameters ?? []) {
        if (parameter.value === undefined) {
          throw new Error(`Missing value for parameter "${parameter.name}"`);
        }
        const parameterRow = operation.locator(
          `.parameters tr[data-param-name="${parameter.name}"][data-param-in="${parameter.in}"]`,
        );
        await parameterRow.locator("input, textarea").fill(parameter.value);
      }

      if (requestBody) {
        for (const [name, value] of Object.entries(requestBody)) {
          if (value === undefined) {
            throw new Error(`Missing value for form-data field "${name}"`);
          }
          await operation
            .getByRole("textbox", { name, exact: true })
            .fill(value);
        }
      }
    });

    const { expectedUrl, responsePromise } =
      await test.step("Prepare expected request URL and response matcher", async () => {
        const expectedUrl = new URL(requestUrl);
        for (const parameter of parameters ?? []) {
          if (parameter.in === "query") {
            expectedUrl.searchParams.set(
              parameter.name,
              parameter.value as string,
            );
          }
        }
        const responsePromise = page.waitForResponse((response) => {
          const actualUrl = new URL(response.url());

          return (
            actualUrl.origin === expectedUrl.origin &&
            actualUrl.pathname === expectedUrl.pathname &&
            actualUrl.searchParams.size === expectedUrl.searchParams.size &&
            [...expectedUrl.searchParams].every(
              ([name, value]) => actualUrl.searchParams.get(name) === value,
            ) &&
            response.request().method() === method
          );
        });

        return { expectedUrl, responsePromise };
      });
    const response =
      await test.step("Execute request and capture matching API response", async () => {
        await operation
          .getByRole("button", { name: "Execute", exact: true })
          .click();
        return responsePromise;
      });

    await test.step("Check the request URL and response status", async () => {
      // Response headers arrive before Swagger can read and render the body.
      expect(
        await response.finished(),
        "The response body should finish downloading",
      ).toBeNull();

      const responseStatus = operation
        .locator(".live-responses-table tbody td.response-col_status")
        .describe("Status code displayed by Swagger");
      await expect(
        responseStatus,
        "The response status should be 200",
      ).toHaveText("200");

      await expect(
        operation.locator(".request-url pre"),
        "The request URL should match the expected URL",
      ).toHaveText(expectedUrl.toString());
    });
  });
});
