// Ref Link: https://dev.to/nilanth/how-to-use-axios-in-an-optimized-and-scalable-way-with-react-518n

import axios from "axios";

// REST API JSON Server
const axiosClient = axios.create({
  baseURL: "https://zuupee.pockethost.io/api/collections",
  // baseURL: "http://localhost:8090/api/collections",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

export const getRequest = (URL: string) => {
  return axiosClient.get(URL).then((response) => response);
};

export const postRequest = (URL: string, payload: unknown) => {
  return axiosClient.post(URL, payload).then((response) => response);
};

export const patchRequest = (URL: string, payload: unknown) => {
  return axiosClient.patch(URL, payload).then((response) => response);
};

export const deleteRequest = (URL: string) => {
  return axiosClient.delete(URL).then((response) => response);
};

// File Upload Server
// const axiosClientFileUpload = axios.create({
//   baseURL: 'http://localhost:5000',
// });

// export const uploadFile = (URL, payload) => {
//     return axiosClientFileUpload.post(`/${URL}`, payload).then(response => response);
// }
