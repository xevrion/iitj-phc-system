import { Link } from "react-router-dom";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
        <h1 className="text-2xl font-bold text-amber-900">Role Not Supported</h1>
        <p className="mt-2 text-sm text-amber-800">
          This frontend currently includes only patient-facing screens.
        </p>
        <Link
          to="/login"
          className="mt-4 inline-block rounded-md bg-amber-700 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-800"
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
}
