export default function onExit(cb) {
  const listener = () => {
    cb();
  };
  window.addEventListener('beforeunload', listener);
  return () => window.removeEventListener(listener);
}
