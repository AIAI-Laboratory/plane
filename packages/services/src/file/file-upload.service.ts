/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import axios from "axios";
// api service
import { APIService } from "../api.service";

type TUploadMethod = "POST" | "PUT";

/**
 * Service class for handling file upload operations
 * Handles file uploads using either POST (presigned form) or PUT (presigned URL)
 * @extends {APIService}
 */
export class FileUploadService extends APIService {
  private cancelSource: any;

  constructor() {
    super("");
  }

  /**
   * Uploads a file to the specified signed URL
   * Supports both POST (multipart/form-data) and PUT (direct binary) methods
   * @param {string} url - The URL to upload the file to
   * @param {File} file - The file to upload
   * @param {string} method - The HTTP method to use ('POST' or 'PUT')
   * @param {object} headers - Additional headers for PUT uploads (e.g., Content-Type)
   * @returns {Promise<void>} Promise resolving to void
   * @throws {Error} If the request fails
   */
  async uploadFile(
    url: string,
    file: File,
    method: TUploadMethod = "POST",
    headers: Record<string, string> = {}
  ): Promise<void> {
    this.cancelSource = axios.CancelToken.source();

    if (method === "PUT") {
      // PUT upload for Cloudflare R2 and similar S3-compatible services
      // Uses raw binary upload with Content-Type header
      return this.put(url, file, {
        headers: {
          "Content-Type": file.type || "application/octet-stream",
          ...headers,
        },
        cancelToken: this.cancelSource.token,
        withCredentials: false,
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
    return this.post(url, file, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      cancelToken: this.cancelSource.token,
      withCredentials: false,
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

  /**
   * Cancels the upload
   */
  cancelUpload() {
    this.cancelSource?.cancel("Upload canceled");
  }
}
