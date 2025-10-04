/**
 * Avatar Debug Component
 * 
 * Temporarily add this to your profile page to debug avatar issues.
 * 
 * Usage:
 * import AvatarDebug from './AvatarDebug';
 * 
 * // Inside your Profile component:
 * <AvatarDebug user={user} avatarUrl={avatarUrl} />
 */

import { User } from '@supabase/supabase-js';

interface AvatarDebugProps {
  user: User | null;
  avatarUrl: string | null;
}

export default function AvatarDebug({ user, avatarUrl }: AvatarDebugProps) {
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg shadow-xl max-w-md text-xs font-mono z-50 max-h-96 overflow-auto">
      <div className="font-bold text-sm mb-2 text-yellow-400">🔍 Avatar Debug Info</div>
      
      <div className="space-y-2">
        <div>
          <span className="text-gray-400">User ID:</span>
          <div className="text-green-400 break-all">{user?.id || 'Not loaded'}</div>
        </div>

        <div>
          <span className="text-gray-400">Avatar URL (state):</span>
          <div className="text-blue-400 break-all">{avatarUrl || 'null'}</div>
        </div>

        <div>
          <span className="text-gray-400">Avatar URL (user metadata):</span>
          <div className="text-purple-400 break-all">
            {(user?.user_metadata?.avatar_url as string) || 'null'}
          </div>
        </div>

        <div>
          <span className="text-gray-400">Match:</span>
          <div className={avatarUrl === user?.user_metadata?.avatar_url ? 'text-green-400' : 'text-red-400'}>
            {avatarUrl === user?.user_metadata?.avatar_url ? '✓ Yes' : '✗ No'}
          </div>
        </div>

        <div className="pt-2 border-t border-gray-700">
          <button
            onClick={() => {
              if (avatarUrl) {
                window.open(avatarUrl, '_blank');
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-white text-xs"
            disabled={!avatarUrl}
          >
            Test Avatar URL
          </button>
        </div>

        <div className="pt-2 border-t border-gray-700">
          <span className="text-gray-400">Supabase Config:</span>
          <div className="text-xs">
            <div>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Set' : '✗ Missing'}</div>
            <div>Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
