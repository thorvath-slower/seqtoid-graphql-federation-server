export const SUCCEEDED = "SUCCEEDED";
export const SUCCEEDED_WITH_ISSUE = "SUCCEEDED_WITH_ISSUE";
export const FAILED = "FAILED";  
export const TIMED_OUT = "TIMED_OUT";
export const ABORTED = "ABORTED";
export const RUNNING = "RUNNING";
export const CREATED = "CREATED";
export const PENDING = "PENDING";
export const STARTED = "STARTED";

export const parseRefFasta = (fullPath: string | null | undefined) => {
  if (!fullPath) {
    return null;
  }
  const afterLastSlash = fullPath.split("/").pop();
  return afterLastSlash;
}

export const isRunFinalized = (status: string) => {
  const finalizedStatuses = [SUCCEEDED, SUCCEEDED_WITH_ISSUE, FAILED, TIMED_OUT, ABORTED];
  if (finalizedStatuses.includes(status)) {
    return true;
  }
  return false;
}