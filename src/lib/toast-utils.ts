import { toast } from "sonner";

export type ToastReturn = string | number;

export interface ToastOptions {
  duration?: number;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Centralized toast utilities for the application
 * Provides consistent messaging with unified styling
 */
export const toastUtils = {
  /**
   * Success notification
   */
  // eslint-disable-next-line sonarjs/function-return-type
  success: (message: string, options?: ToastOptions): ToastReturn => {
    const result = toast.success(message, {
      duration: options?.duration ?? 4000,
      description: options?.description,
      action: options?.action,
    });
    return result as ToastReturn;
  },

  /**
   * Error notification
   */
  // eslint-disable-next-line sonarjs/function-return-type
  error: (message: string, options?: ToastOptions): ToastReturn => {
    const result = toast.error(message, {
      duration: options?.duration ?? 6000,
      description: options?.description,
      action: options?.action,
    });
    return result as ToastReturn;
  },

  /**
   * Warning notification
   */
  // eslint-disable-next-line sonarjs/function-return-type
  warning: (message: string, options?: ToastOptions): ToastReturn => {
    const result = toast.warning(message, {
      duration: options?.duration ?? 5000,
      description: options?.description,
      action: options?.action,
    });
    return result as ToastReturn;
  },

  /**
   * Info notification
   */
  // eslint-disable-next-line sonarjs/function-return-type
  info: (message: string, options?: ToastOptions): ToastReturn => {
    const result = toast.info(message, {
      duration: options?.duration ?? 4000,
      description: options?.description,
      action: options?.action,
    });
    return result as ToastReturn;
  },

  /**
   * Загрузка с возможностью обновления
   */
  // eslint-disable-next-line sonarjs/function-return-type
  loading: (message: string): ToastReturn => {
    const result = toast.loading(message);
    return result as ToastReturn;
  },

  /**
   * Обновить существующий toast
   */
  update: (toastId: ToastReturn, message: string, type: "success" | "error" | "warning" | "info"): void => {
    let toastFn: (message: string) => ToastReturn;

    switch (type) {
      case "success": {
        toastFn = toast.success;
        break;
      }
      case "error": {
        toastFn = toast.error;
        break;
      }
      case "warning": {
        toastFn = toast.warning;
        break;
      }
      case "info": {
        toastFn = toast.info;
        break;
      }
    }

    toast.dismiss(toastId);
    toastFn(message);
  },

  /**
   * Закрыть конкретный toast
   */
  dismiss: (toastId: ToastReturn): void => {
    toast.dismiss(toastId);
  },

  /**
   * Закрыть все toast
   */
  dismissAll: (): void => {
    toast.dismiss();
  },

  /**
   * Специальные сообщения для CSV upload
   */
  csv: {
    uploadStarted: (fileName: string): ToastReturn => toast.loading(`📤 Uploading file: ${fileName}`) as ToastReturn,

    uploadCompleted: (fileName: string, count: number): ToastReturn =>
      toast.success(`File ${fileName} uploaded successfully! Processed ${count} records`, {
        duration: 5000,
      }) as ToastReturn,

    uploadFailed: (fileName: string, error: string): ToastReturn =>
      toast.error(`Upload failed for ${fileName}: ${error}`, {
        duration: 7000,
      }) as ToastReturn,

    processingStarted: (fileName: string): ToastReturn =>
      toast.loading(`⚙️ Processing CSV: ${fileName}`) as ToastReturn,

    validationErrors: (fileName: string, errorCount: number, processedCount: number): ToastReturn =>
      toast.warning(`${fileName}: processed ${processedCount} records, found ${errorCount} validation errors`, {
        duration: 6000,
      }) as ToastReturn,

    sessionExpired: (): ToastReturn =>
      toast.error("Session expired. Please refresh the page and log in again", {
        duration: 8000,
        action: {
          label: "Refresh",
          onClick: () => {
            globalThis.location.reload();
          },
        },
      }) as ToastReturn,

    fileTooBig: (fileName: string, maxSize: string): ToastReturn =>
      toast.error(`File ${fileName} is too large. Maximum size: ${maxSize}`, {
        duration: 5000,
      }) as ToastReturn,

    invalidFormat: (fileName: string): ToastReturn =>
      toast.error(`Invalid format for ${fileName}. Only CSV files are supported`, {
        duration: 5000,
      }) as ToastReturn,

    maxFilesExceeded: (maxFiles: number): ToastReturn =>
      toast.error(`Maximum ${maxFiles} files can be uploaded simultaneously`, {
        duration: 4000,
      }) as ToastReturn,
  },

  /**
   * Authentication-related toasts
   */
  auth: {
    loginFailed: (description?: string): ToastReturn =>
      toast.error("Authentication Failed", {
        description: description ?? "Invalid credentials. Please check your email and password.",
        duration: 5000,
      }) as ToastReturn,

    twoFactorRequired: (): ToastReturn =>
      toast.info("Two-Factor Authentication Required", {
        description: "Enter the code from your authenticator app.",
        duration: 4000,
      }) as ToastReturn,

    loginSuccess: (userName?: string): ToastReturn =>
      toast.success("Login Successful", {
        description: userName ? `Welcome back, ${userName}!` : "You have been logged in successfully.",
        duration: 3000,
      }) as ToastReturn,

    logoutSuccess: (): ToastReturn =>
      toast.success("Logged Out", {
        description: "You have been logged out successfully.",
        duration: 3000,
      }) as ToastReturn,

    passwordChanged: (): ToastReturn =>
      toast.success("Password Updated", {
        description: "Your password has been changed successfully.",
        duration: 4000,
      }) as ToastReturn,

    accountLocked: (): ToastReturn =>
      toast.error("Account Locked", {
        description: "Too many failed attempts. Please try again later.",
        duration: 6000,
      }) as ToastReturn,
  },

  /**
   * User management toasts
   */
  user: {
    created: (userName: string): ToastReturn =>
      toast.success("User Created", {
        description: `User ${userName} has been created successfully.`,
        duration: 4000,
      }) as ToastReturn,

    updated: (userName: string): ToastReturn =>
      toast.success("User Updated", {
        description: `User ${userName} has been updated successfully.`,
        duration: 4000,
      }) as ToastReturn,

    deleted: (userName: string): ToastReturn =>
      toast.success("User Deleted", {
        description: `User ${userName} has been deleted successfully.`,
        duration: 4000,
      }) as ToastReturn,

    actionFailed: (action: string, error?: string): ToastReturn =>
      toast.error(`${action} Failed`, {
        description: error ?? "An error occurred while performing this action.",
        duration: 5000,
      }) as ToastReturn,
  },
} as const;

/**
 * Типы для экспорта
 */
export type ToastType = "success" | "error" | "warning" | "info" | "loading";
