import { defineTool } from "@lovable.dev/mcp-js";
import { reviewsAiToolConfig } from "../reviewsai-tool";

export default defineTool(reviewsAiToolConfig("get_ranking_history"));
