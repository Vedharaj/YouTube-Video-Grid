// Minimal module declarations to avoid type mismatches with installed @types
declare module 'react-dnd' {
  export const DndProvider: any;
  export function useDrag(...args: any[]): any;
  export function useDrop(...args: any[]): any;
  export const DragDropContext: any;
  export default any;
}

declare module 'react-dnd-html5-backend' {
  const HTML5Backend: any;
  export { HTML5Backend };
  export default HTML5Backend;
}

declare module 'react-dnd-touch-backend' {
  const TouchBackend: any;
  export type TouchBackendOptions = any;
  export { TouchBackend };
  export default TouchBackend;
}
