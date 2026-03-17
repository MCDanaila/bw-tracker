import { useState, useEffect } from "react";
import { localDB, type SyncAction } from "@/lib/db";
import { useAuth } from "@/contexts/AuthContext";
import { type DailyLog } from "@/types/database";
import { TodayDashboardView } from "./views/TodayDashboardView";
import { MorningFlowView } from "./views/MorningFlowView";
import { TrainingFlowView } from "./views/TrainingFlowView";
import { EndOfDayFlowView } from "./views/EndOfDayFlowView";
import { getLocalDateStr } from "@/lib/utils";

export type ViewState = "dashboard" | "morning" | "training" | "end_of_day";

export interface DailyTrackerWizardProps {
    // If passed directly (e.g., from History view editing)
    editItem?: SyncAction | null;
    onClearEdit?: () => void;
}

export default function DailyTrackerWizard({ editItem }: DailyTrackerWizardProps) {
    const { user } = useAuth();
    const [activeView, setActiveView] = useState<ViewState>("dashboard");
    const [todayLog, setTodayLog] = useState<DailyLog | null>(null);
    const [yesterdayLog, setYesterdayLog] = useState<DailyLog | null>(null);
    const [last7DaysAvg, setLast7DaysAvg] = useState<Partial<DailyLog> | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch existing data for today to pre-fill the wizard views
    useEffect(() => {
        async function fetchTodayLog() {
            if (!user) return;
            setIsLoading(true);

            if (editItem) {
                setTodayLog(editItem.payload);
            } else {
                try {
                    const todayDate = getLocalDateStr();
                    const existingLogAction = await localDB.syncQueue
                        .where('mutation_type')
                        .equals('UPSERT_DAILY_LOG')
                        .toArray();

                    // Note: In a robust app, we should check DB table too.
                    // For now, looking at syncQueue mimicking DailyLogForm logic.
                    const todayAction = existingLogAction.find(a => a.payload?.date === todayDate);

                    if (todayAction && todayAction.payload) {
                        setTodayLog(todayAction.payload);
                    } else {
                        const smartDefaultsJson = localStorage.getItem("bw_tracker_smart_defaults");
                        if (smartDefaultsJson) {
                            try {
                                const parsed = JSON.parse(smartDefaultsJson);
                                setTodayLog({
                                    weight_fasting: parsed.weight_fasting,
                                    sleep_hours: parsed.sleep_hours,
                                    water_liters: parsed.water_liters,
                                    salt_grams: parsed.salt_grams,
                                    steps: parsed.steps,
                                    stress_level: parsed.stress_level,
                                    hrv: parsed.hrv,
                                });
                            } catch (e) {
                                console.error("Failed to parse defaults", e);
                            }
                        } else {
                            setTodayLog(null); // Completely fresh
                        }
                    }

                    // Fetch recent logs for contextual hints & 7-day average
                    const allPastLogs = existingLogAction
                        .filter(a => a.payload?.date && a.payload.date < todayDate)
                        .sort((a, b) => new Date(b.payload.date).getTime() - new Date(a.payload.date).getTime());

                    let pastLogsData: any[] = [];
                    if (allPastLogs.length > 0) {
                        pastLogsData = allPastLogs.map(a => a.payload);
                    } else {
                        const { supabase } = await import('@/lib/supabase');
                        const { data } = await supabase
                            .from('daily_logs')
                            .select('*')
                            .eq('user_id', user.id)
                            .lt('date', todayDate)
                            .order('date', { ascending: false })
                            .limit(7);

                        if (data) {
                            pastLogsData = data;
                        }
                    }

                    if (pastLogsData.length > 0) {
                        setYesterdayLog(pastLogsData[0]);

                        let avgWeight = 0, avgSleep = 0, avgHrv = 0;
                        let weightCount = 0, sleepCount = 0, hrvCount = 0;

                        pastLogsData.slice(0, 7).forEach((log: any) => {
                            if (log.weight_fasting) { avgWeight += Number(log.weight_fasting); weightCount++; }
                            if (log.sleep_hours) { avgSleep += Number(log.sleep_hours); sleepCount++; }
                            if (log.hrv) { avgHrv += Number(log.hrv); hrvCount++; }
                        });

                        setLast7DaysAvg({
                            weight_fasting: weightCount > 0 ? (avgWeight / weightCount).toFixed(1) : null,
                            sleep_hours: sleepCount > 0 ? (avgSleep / sleepCount).toFixed(1) : null,
                            hrv: hrvCount > 0 ? Math.round(avgHrv / hrvCount) : null,
                        });
                    }
                } catch (error) {
                    console.error("Error fetching today's log:", error);
                }
            }
            setIsLoading(false);
        }

        fetchTodayLog();
    }, [user, editItem]);

    const handleNavigate = (view: ViewState) => {
        setActiveView(view);
    };

    // Callback fired when a sub-flow successfully upserts data to the DB.
    // It updates the local context state so the Dashboard reflects the new completion checkmarks.
    const handleFlowComplete = (updatedPayload: any) => {
        setTodayLog(updatedPayload);
        setActiveView("dashboard");
    };

    if (isLoading) {
        return <div className="flex items-center justify-center p-12 text-muted-foreground animate-pulse">Loading today's flow...</div>;
    }

    return (
        <div className="w-full max-w-lg mx-auto pb-24">
            {activeView === "dashboard" && (
                <TodayDashboardView
                    todayLog={todayLog}
                    onNavigate={handleNavigate}
                />
            )}
            {activeView === "morning" && (
                <MorningFlowView
                    existingData={todayLog}
                    yesterdayData={yesterdayLog}
                    last7DaysAvg={last7DaysAvg}
                    onBack={() => handleNavigate("dashboard")}
                    onSave={handleFlowComplete}
                />
            )}

            {activeView === "training" && (
                <TrainingFlowView
                    existingData={todayLog}
                    yesterdayData={yesterdayLog}
                    onBack={() => handleNavigate("dashboard")}
                    onSave={handleFlowComplete}
                />
            )}

            {activeView === "end_of_day" && (
                <EndOfDayFlowView
                    existingData={todayLog}
                    onBack={() => handleNavigate("dashboard")}
                    onSave={handleFlowComplete}
                />
            )}
        </div>
    );
}
