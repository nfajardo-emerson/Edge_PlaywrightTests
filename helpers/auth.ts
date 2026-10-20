import axios from "axios";
import FormData from "form-data";
import { Agent } from "node:https";

async function getAccessToken() {
  const username = process.env.EDGE_USERNAME as string;
  const password = process.env.EDGE_PASSWORD as string;

  const formData = new FormData();
  formData.append("username", username);
  formData.append("password", password);

  const response = await axios.post(
    process.env.EDGE_AUTH_URL as string,
    formData,
    {
      httpsAgent: new Agent({ rejectUnauthorized: false }),
    },
  );

  //   console.log(response.data.accessToken);

  return response.data.accessToken;
}

export { getAccessToken };
