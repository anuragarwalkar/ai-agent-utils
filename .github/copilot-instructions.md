# GitHub Copilot Instructions for AI Agent Utils

## Architecture

- **Frontend**: React with Vite typescript, shadcn ui, Redux Toolkit for state management
- **Build**: Vite for UI
-- **Frontend framewor** Langchain

## General Principles

- **Functional Programming**: Prefer pure functions, immutability, and composition over classes and side effects.
- **DRY (Don’t Repeat Yourself)**: Before writing new logic, check if a utility/helper/service already exists. If yes, reuse instead of duplicating.
- **File Size**: Max 200 lines per file.
- **Modularity**: Components and functions must be small and composable.
- **Separation of Concerns**: 
  - Container components handle state and business logic (via Redux).
  - Presentational components are pure, stateless, and UI-only.
- **Props**: Keep prop count small. Avoid prop drilling by using Redux or Context.

- **Logging (UI)**: 
  - Use a consistent `console.log` format:  
    `console.log("[COMPONENT_NAME] [FUNCTION_NAME] message", data);`  
  - Always include component and function name in logs.  
  - Do not scatter raw `console.log` everywhere — create a small `log.js` utility for reuse.
- **Swagger**: Auto-generate OpenAPI/Swagger docs for all Express endpoints.
- **Error Handling**: Use proper try/catch, error boundaries in UI, and meaningful error messages in BE.
- **Performance**: Lazy load routes, debounce inputs, and memoize expensive operations.

## Folder/Code Organization for UI

- `src/utils/`: Reusable helper functions (date, formatting, validation, logging).
- `src/hooks/`: Custom React hooks (e.g., `useAuth`, `useDebounce`).
- `src/services/`: API clients and business logic.
- `src/components/common/`: Reusable presentational components.
- `src/config/` + `src/constants/`: Centralized config, constants, and magic values.

## Deployment Notes

- **ES Modules Only**: Use `import/export`, not `require/module.exports`.
- **Redux Toolkit Query**: For API calls, prefer RTK Query instead of raw fetch/axios.
- **Agentic AI Guidance**: 
  - Always refactor common logic into `utils/`, `hooks/`, or `services/`.
  - Never duplicate functionality across files. 
  - Reuse constants from `src/constants/` instead of redefining them.
  - Use shared logging and error handling utilities consistently.