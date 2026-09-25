export type AvailabilityMode = "manual" | "schedule";

export type WeeklyAvailabilityDay = {
  weekday: number;
  label: string;
  enabled: boolean;
  start: string;
  end: string;
};

export const defaultWeeklyAvailability: WeeklyAvailabilityDay[] = [
  { weekday: 0, label: "Domingo", enabled: false, start: "07:00", end: "18:00" },
  { weekday: 1, label: "Segunda", enabled: true, start: "07:00", end: "18:00" },
  { weekday: 2, label: "Terça", enabled: true, start: "07:00", end: "18:00" },
  { weekday: 3, label: "Quarta", enabled: true, start: "07:00", end: "18:00" },
  { weekday: 4, label: "Quinta", enabled: true, start: "07:00", end: "18:00" },
  { weekday: 5, label: "Sexta", enabled: true, start: "07:00", end: "18:00" },
  { weekday: 6, label: "Sábado", enabled: true, start: "07:00", end: "14:00" },
];

function minutes(value: string) {
  const [hour = "0", minute = "0"] = value.split(":");
  return Number(hour) * 60 + Number(minute);
}

function currentMinutes(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

export function isWithinWeeklyAvailability(date: Date, schedule: WeeklyAvailabilityDay[]) {
  const weekday = date.getDay();
  const now = currentMinutes(date);
  const current = schedule.find((day) => day.weekday === weekday);

  if (current?.enabled) {
    const start = minutes(current.start);
    const end = minutes(current.end);

    if (start === end) return true;
    if (start < end && now >= start && now < end) return true;
    if (start > end && now >= start) return true;
  }

  const previousWeekday = (weekday + 6) % 7;
  const previous = schedule.find((day) => day.weekday === previousWeekday);

  if (previous?.enabled) {
    const previousStart = minutes(previous.start);
    const previousEnd = minutes(previous.end);

    if (previousStart > previousEnd && now < previousEnd) return true;
  }

  return false;
}

export function driverAvailabilityStatus({
  approved,
  mode,
  manualOnline,
  schedulePaused,
  schedule,
  now = new Date(),
}: {
  approved: boolean;
  mode: AvailabilityMode;
  manualOnline: boolean;
  schedulePaused: boolean;
  schedule: WeeklyAvailabilityDay[];
  now?: Date;
}) {
  if (!approved) {
    return {
      online: false,
      label: "Cadastro não aprovado",
      reason: "A aprovação dos documentos é obrigatória para receber corridas.",
    };
  }

  if (mode === "manual") {
    return manualOnline
      ? {
          online: true,
          label: "Online",
          reason: "Disponibilidade manual ligada.",
        }
      : {
          online: false,
          label: "Offline",
          reason: "Disponibilidade manual desligada.",
        };
  }

  if (schedulePaused) {
    return {
      online: false,
      label: "Pausado",
      reason: "Agenda automática pausada manualmente.",
    };
  }

  const scheduledOnline = isWithinWeeklyAvailability(now, schedule);
  return scheduledOnline
    ? {
        online: true,
        label: "Online pelo horário",
        reason: "Você está dentro de uma janela automática de disponibilidade.",
      }
    : {
        online: false,
        label: "Fora do horário",
        reason: "A próxima disponibilidade depende da sua agenda configurada.",
      };
}
