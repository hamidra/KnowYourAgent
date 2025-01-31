"use client";

import { useCallback } from "react";

const serialize = <T>(data: T) => JSON.stringify(data);
const deserialize = <T>(data: string) => JSON.parse(data) as T;

type PersistedState<T> = {
  messages: T[];
  __version: string;
};

const version = "v1.0";
export function usePersistedConversation<T>(key: string) {
  const setConversation = useCallback(
    (messages: T[]) => {
      try {
        const serialized = serialize<PersistedState<T>>({
          messages,
          __version: version,
        });
        localStorage?.setItem(key, serialized);
      } catch (error) {
        console.error(`Error persisting state for key "${key}":`, error);
      }
    },
    [key],
  );

  const clearConversation = useCallback(() => {
    try {
      localStorage?.removeItem(key);
    } catch (error) {
      console.error(`Error clearing state for key "${key}":`, error);
    }
  }, [key]);

  const getConversation = useCallback(() => {
    try {
      const serialized = localStorage?.getItem(key);
      if (serialized) {
        const data = deserialize<PersistedState<T>>(serialized);
        return data?.messages || [];
      }
    } catch (error) {
      console.error(`Error deserializing state for key "${key}":`, error);
    }
  }, [key]);

  return {
    getConversation,
    setConversation,
    clearConversation,
  } as const;
}
