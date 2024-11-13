import { GITHUB_CLIENT_ID, GITHUB_OAUTH_URL } from '@/lib/constants';

export function loginWithGithub() {
  const width = 790;
  const height = 720;
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;

  if (window.authWindow?.closed === false) {
    window.authWindow.focus();
  } else {
    window.authWindow = window.open(
      `${GITHUB_OAUTH_URL}/authorize?client_id=${GITHUB_CLIENT_ID}&scope=repo`,
      '_blank',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,status=yes`,
    );
  }
}
