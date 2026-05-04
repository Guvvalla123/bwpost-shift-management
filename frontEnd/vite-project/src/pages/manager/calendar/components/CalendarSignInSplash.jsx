import { Calendar, Plus, Users, ChevronRight } from 'lucide-react'

export default function CalendarSignInSplash({ onLogin }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-[#f1f5f9] px-4">
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-[#162d5e] shadow-lg flex items-center justify-center">
            <Calendar className="w-10 h-10 text-white" />
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Google Calendar</h1>
          <p className="text-gray-500 text-sm mt-2">
            Sign in with your Google account to view calendar events and sync
            work shifts.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-slate-50 text-left">
          {[
            { Icon: Calendar, text: 'View your calendar events' },
            { Icon: Plus, text: 'Create and manage events' },
            { Icon: Users, text: 'See event attendees' },
          ].map(({ Icon, text }, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-sm text-gray-700">{text}</p>
              <ChevronRight className="w-4 h-4 text-gray-300 ml-auto" />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onLogin}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 shadow-sm hover:shadow-md py-3.5 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Sign in with Google
        </button>

        <p className="text-xs text-gray-400">
          We only request read/write access to your Google Calendar.
        </p>
      </div>
    </div>
  )
}
