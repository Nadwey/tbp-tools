import { ConfigParseResultState, parseConfig, type ConfigParseResultError } from "@/lib/brewery-parser/breweryParser";
import { Editor } from "@monaco-editor/react";
import { useState } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "../ui/resizable";

const DEFAULT_YAML = `# PASTE YOUR CONFIG HERE
# Everything is client-sided, so no one will steal your config :)
`;

const DEFAULT_JSON = `Your config as JSON will appear here
And from JSON we will be able to generate the new YAML config
`;

function getErrorMessage(error?: ConfigParseResultError) {
    return (
        `Error during parsing

---
${error?.message}
---

If you think this is a bug, please report it, with this entire message
stage: ${error?.stage}` +
        (error?.stack &&
            `\nstack:
${error?.stack
    .split("\n")
    .map((line) => `    ${line}`)
    .join("\n")}`)
    );
}

export default function BreweryParser() {
    const [config, setConfig] = useState<string | null>();

    function onEditorChange(value: string | undefined) {
        const parseResult = parseConfig(value || "");
        if (parseResult.state === ConfigParseResultState.SUCCESS) {
            setConfig(JSON.stringify(parseResult.config, null, 4));
            return;
        }

        if (parseResult.state === ConfigParseResultState.EMPTY) {
            setConfig(DEFAULT_JSON);
            return;
        }

        setConfig(getErrorMessage(parseResult.error));
    }

    return (
        <div className="h-[calc(100vh-var(--navbar-height))]">
            <ResizablePanelGroup direction="horizontal">
                <ResizablePanel defaultSize={50}>
                    {/* TODO: figure out how to integrate monaco-yaml with this */}
                    <Editor
                        theme="vs-dark"
                        onChange={onEditorChange}
                        height="100%"
                        width="100%"
                        defaultLanguage="yaml"
                        defaultValue={DEFAULT_YAML}
                    />
                </ResizablePanel>
                <ResizableHandle className="w-1" withHandle />
                <ResizablePanel defaultSize={50}>
                    <Editor
                        theme="vs-dark"
                        height="100%"
                        value={config || ""}
                        width="100%"
                        options={{ readOnly: true }}
                        defaultLanguage="json"
                        defaultValue={DEFAULT_JSON}
                    />
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
}
