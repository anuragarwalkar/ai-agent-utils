export const log = {
  info: (component: string, method: string, message: string, data?: unknown) => {
    console.log(`[${component}] [${method}] ${message}`, data || '');
  },
  
  warn: (component: string, method: string, message: string, data?: unknown) => {
    console.warn(`[${component}] [${method}] ${message}`, data || '');
  },
  
  error: (component: string, method: string, message: string, data?: unknown) => {
    console.error(`[${component}] [${method}] ${message}`, data || '');
  },
  
  debug: (component: string, method: string, message: string, data?: unknown) => {
    // Only show debug logs in development (check if we're in a Chrome extension environment)
    const isDev = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest?.()?.name?.includes('dev');
    if (isDev) {
      console.debug(`[${component}] [${method}] ${message}`, data || '');
    }
  },
};

export const createLogger = (component: string) => ({
  info: (method: string, message: string, data?: unknown) => 
    log.info(component, method, message, data),
  warn: (method: string, message: string, data?: unknown) => 
    log.warn(component, method, message, data),
  error: (method: string, message: string, data?: unknown) => 
    log.error(component, method, message, data),
  debug: (method: string, message: string, data?: unknown) => 
    log.debug(component, method, message, data),
});
