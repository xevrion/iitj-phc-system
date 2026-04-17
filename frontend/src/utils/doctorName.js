const DOCTOR_PREFIX_REGEX = /^dr\.?\s+/i;

export const stripDoctorPrefix = (name = "") => name.replace(DOCTOR_PREFIX_REGEX, "").trim();

export const formatDoctorName = (name, fallback = "Doctor") => {
  const normalized = stripDoctorPrefix(name || "");
  return normalized ? `Dr. ${normalized}` : fallback;
};

export const getDoctorInitial = (name, fallback = "D") => {
  const normalized = stripDoctorPrefix(name || "");
  return (normalized || fallback).charAt(0).toUpperCase();
};
