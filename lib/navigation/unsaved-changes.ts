"use client";

import { useCallback, useEffect, useRef } from "react";

const NAVIGATION_REQUEST_EVENT = "ttrpg:request-navigation";
const NAVIGATION_BYPASS_DURATION_MS = 10_000;

type NavigationApiEvent = Event & {
  canIntercept?: boolean;
  destination?: {
    url: string;
  };
  downloadRequest?: string | null;
  hashChange?: boolean;
  navigationType?: string;
};

type NavigationApi = EventTarget;

export function requestUnsavedChangesNavigation(): boolean {
  if (typeof window === "undefined") {
    return true;
  }

  return window.dispatchEvent(
    new Event(NAVIGATION_REQUEST_EVENT, {
      cancelable: true,
    }),
  );
}

type UnsavedChangesGuardOptions = {
  enabled: boolean;
  confirmMessage: string;
};

export function useUnsavedChangesGuard({
  enabled,
  confirmMessage,
}: UnsavedChangesGuardOptions) {
  const enabledRef = useRef(enabled);
  const confirmMessageRef = useRef(confirmMessage);
  const bypassNavigationRef = useRef(false);
  const bypassTimeoutRef = useRef<number | null>(null);
  const restoringHistoryRef = useRef(false);

  useEffect(() => {
    enabledRef.current = enabled;
    confirmMessageRef.current = confirmMessage;
  }, [confirmMessage, enabled]);

  const clearNavigationBypass = useCallback(() => {
    bypassNavigationRef.current = false;

    if (bypassTimeoutRef.current !== null) {
      window.clearTimeout(bypassTimeoutRef.current);
      bypassTimeoutRef.current = null;
    }
  }, []);

  const allowNavigation = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    bypassNavigationRef.current = true;

    if (bypassTimeoutRef.current !== null) {
      window.clearTimeout(bypassTimeoutRef.current);
    }

    bypassTimeoutRef.current = window.setTimeout(() => {
      bypassNavigationRef.current = false;
      bypassTimeoutRef.current = null;
    }, NAVIGATION_BYPASS_DURATION_MS);
  }, []);

  useEffect(() => {
    if (!enabled) {
      clearNavigationBypass();
      return;
    }

    function confirmNavigation(): boolean {
      if (bypassNavigationRef.current || !enabledRef.current) {
        return true;
      }

      return window.confirm(confirmMessageRef.current);
    }

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (bypassNavigationRef.current || !enabledRef.current) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    }

    function handleNavigationRequest(event: Event) {
      if (!confirmNavigation()) {
        event.preventDefault();
        return;
      }

      allowNavigation();
    }

    function handleDocumentClick(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest<HTMLAnchorElement>("a[href]");
      if (
        !anchor ||
        anchor.hasAttribute("download") ||
        (anchor.target && anchor.target !== "_self")
      ) {
        return;
      }

      const destination = new URL(anchor.href, window.location.href);
      if (
        destination.origin !== window.location.origin ||
        (destination.pathname === window.location.pathname &&
          destination.search === window.location.search)
      ) {
        return;
      }

      if (!confirmNavigation()) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      allowNavigation();
    }

    function handlePopState() {
      if (bypassNavigationRef.current || !enabledRef.current) {
        return;
      }

      if (restoringHistoryRef.current) {
        restoringHistoryRef.current = false;
        return;
      }

      if (window.confirm(confirmMessageRef.current)) {
        allowNavigation();
        return;
      }

      restoringHistoryRef.current = true;
      window.history.forward();

      window.setTimeout(() => {
        restoringHistoryRef.current = false;
      }, 1_000);
    }

    function handleNavigationApiEvent(event: Event) {
      const navigationEvent = event as NavigationApiEvent;

      if (
        navigationEvent.navigationType === "reload" ||
        navigationEvent.hashChange ||
        navigationEvent.downloadRequest ||
        navigationEvent.canIntercept === false ||
        !event.cancelable
      ) {
        return;
      }

      const destinationUrl = navigationEvent.destination?.url;
      if (destinationUrl) {
        const destination = new URL(destinationUrl);

        if (
          destination.pathname === window.location.pathname &&
          destination.search === window.location.search
        ) {
          return;
        }
      }

      if (!confirmNavigation()) {
        event.preventDefault();
        return;
      }

      allowNavigation();
    }

    const navigation = (
      window as Window & {
        navigation?: NavigationApi;
      }
    ).navigation;

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener(NAVIGATION_REQUEST_EVENT, handleNavigationRequest);

    if (navigation) {
      navigation.addEventListener("navigate", handleNavigationApiEvent);
    } else {
      document.addEventListener("click", handleDocumentClick, true);
      window.addEventListener("popstate", handlePopState);
    }

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener(
        NAVIGATION_REQUEST_EVENT,
        handleNavigationRequest,
      );

      if (navigation) {
        navigation.removeEventListener("navigate", handleNavigationApiEvent);
      } else {
        document.removeEventListener("click", handleDocumentClick, true);
        window.removeEventListener("popstate", handlePopState);
      }
    };
  }, [allowNavigation, clearNavigationBypass, enabled]);

  useEffect(() => {
    return () => {
      if (bypassTimeoutRef.current !== null) {
        window.clearTimeout(bypassTimeoutRef.current);
      }
    };
  }, []);

  return {
    allowNavigation,
  };
}
