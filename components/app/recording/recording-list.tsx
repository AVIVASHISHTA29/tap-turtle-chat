// components/recording-list.tsx
"use client";

import Link from "next/link";

interface Session {
  session_id: string;
  project_id: string;
  start_timestamp: string;
  end_timestamp: string | null;
  page_url: string;
  viewport_width: number;
  viewport_height: number;
  user_agent: string | null;
  referrer: string | null;
}

export function RecordingList({ sessions }: { sessions: Session[] }) {
  return (
    <table className="w-full border-collapse border border-gray-300 text-sm">
      <thead>
        <tr className="bg-gray-100">
          <th className="border border-gray-300 p-2">Session ID</th>
          <th className="border border-gray-300 p-2">Start Time</th>
          <th className="border border-gray-300 p-2">Page URL</th>
          <th className="border border-gray-300 p-2">Dimensions</th>
          <th className="border border-gray-300 p-2">Actions</th>
        </tr>
      </thead>
      <tbody>
        {sessions.map((session) => (
          <tr key={session.session_id} className="hover:bg-gray-50">
            <td className="border border-gray-300 p-2">{session.session_id}</td>
            <td className="border border-gray-300 p-2">
              {session.start_timestamp}
            </td>
            <td className="border border-gray-300 p-2">{session.page_url}</td>
            <td className="border border-gray-300 p-2">
              {session.viewport_width} x {session.viewport_height}
            </td>
            <td className="border border-gray-300 p-2">
              <Link
                href={`/recordings/${session.session_id}`}
                className="underline text-blue-600 hover:text-blue-800"
              >
                Replay
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
