export { TextFixerTool, type TextFixResult } from './textFixer';
export { WebReaderTool, type WebPageContent } from './webReader';
export { QuestionAnswererTool, type QuestionAnswer } from './questionAnswerer';
export { InputFillerTool, type InputFillResult } from './inputFiller';

// Import the tool classes for the registry
import { TextFixerTool } from './textFixer';
import { WebReaderTool } from './webReader';
import { QuestionAnswererTool } from './questionAnswerer';
import { InputFillerTool } from './inputFiller';

// Tool registry for easy access
export const createToolRegistry = () => ({
  textFixer: new TextFixerTool(),
  webReader: new WebReaderTool(),
  questionAnswerer: new QuestionAnswererTool(),
  inputFiller: new InputFillerTool(),
});
