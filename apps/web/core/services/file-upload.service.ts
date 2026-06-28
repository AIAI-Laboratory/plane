/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { AxiosRequestConfig } from "axios";
import axios from "axios";
// services
import { APIService } from "@/services/api.service";

type TUploadMethod = "POST" | "PUT";

export class FileUploadService extends APIService {
  private cancelSource: any;

  constructor() {
    super("");
  }

  /**
   * Uploads a file to the specified signed URL
   * Supports both POST (multipart/form-data) and PUT (direct binary) methods
   * @param {string} url - The URL to upload the file to
   * @param {File | FormData} data - The file or form data to upload
   * @param {TUploadMethod} method - The HTTP method to use ('POST' or 'PUT')
   * @param {Record<string, string>} headers - Additional headers for PUT uploads (e.g., Content-Type)
   * @param {AxiosRequestConfig["onUploadProgress"]} uploadProgressHandler - Progress callback
   */
  async uploadFile(
    url: string,
    data: File | FormData,
    method: TUploadMethod = "POST",
    headers: Record<string, string> = {},
    uploadProgressHandler?: AxiosRequestConfig["onUploadProgress"]
  ): Promise<void> {
    this.cancelSource = axios.CancelToken.source();

    if (method === "PUT") {
      // PUT upload for Cloudflare R2 and similar S3-compatible services
      // Uses raw binary upload with Content-Type header
      return this.put(url, data as File, {
        headers: {
          "Content-Type": (data as File).type || "application/octet-stream",
          ...headers,
        },
        cancelToken: this.cancelSource.token,
        withCredentials: false,
        onUploadProgress: uploadProgressHandler,
      })
        .then((response) => response?.data)
        .catch((error) => {
          if (axios.isCancel(error)) {
            console.log(error.message);
          } else {
            throw error?.response?.data;
          }
        });
    }

    // Default POST upload (multipart/form-data)
    return this.post(url, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      cancelToken: this.cancelSource.token,
      withCredentials: false,
      onUploadProgress: uploadProgressHandler,
    })
      .then((response) => response?.data)
      .catch((error) => {
        if (axios.isCancel(error)) {
          console.log(error.message);
        } else {
          throw error?.response?.data;
        }
      });
  }

  cancelUpload() {
    this.cancelSource?.cancel("Upload canceled");
  }
}
