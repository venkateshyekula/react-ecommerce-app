import { useEffect } from "react";
import type { AuthUser } from "../types/auth";
import { supportTeamService } from "../services/supportTeamService";

export const useSupportTeamAvailabilityHeartbeat = (
  currentUser: AuthUser | null
): void => {
  useEffect(() => {
    if (
      !currentUser ||
      currentUser.role !== "SUPPORT" ||
      !currentUser.supportTeamCode
    ) {
      return;
    }

    let cancelled = false;

    const sendHeartbeat = async (): Promise<void> => {
      if (cancelled) {
        return;
      }

      try {
        await supportTeamService.heartbeatByUserId(currentUser.id);
      } catch {
        // Silent heartbeat failure.
      }
    };

    const handleVisibilityChange = (): void => {
      if (document.visibilityState === "visible") {
        void supportTeamService.updateAvailabilityByUserId({
          userId: currentUser.id,
          availabilityStatus: "AVAILABLE"
        });
      }

      if (document.visibilityState === "hidden") {
        void supportTeamService.updateAvailabilityByUserId({
          userId: currentUser.id,
          availabilityStatus: "AWAY"
        });
      }
    };

    void sendHeartbeat();

    const intervalId = window.setInterval(() => {
      void sendHeartbeat();
    }, 60_000);

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      void supportTeamService.updateAvailabilityByUserId({
        userId: currentUser.id,
        availabilityStatus: "AWAY"
      });
    };
  }, [currentUser]);
};