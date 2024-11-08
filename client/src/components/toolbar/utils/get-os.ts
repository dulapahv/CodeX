export function getOS(): string {
  const userAgent = navigator.userAgent || (window as any).opera;

  if (/windows phone/i.test(userAgent)) {
    return "Windows Phone";
  }
  if (/win/i.test(userAgent)) {
    return "Windows";
  }
  if (/mac/i.test(userAgent)) {
    return "MacOS";
  }
  if (/android/i.test(userAgent)) {
    return "Android";
  }
  if (/linux/i.test(userAgent)) {
    return "Linux";
  }
  if (/iphone|ipad|ipod/i.test(userAgent)) {
    return "iOS";
  }

  return "Unknown";
}
