import { parseConfig } from "@/lib/brewery-parser/breweryParser";
import { Editor } from "@monaco-editor/react";
import { useState } from "react";

const DEFAULT_YAML = `# PASTE YOUR CONFIG HERE
# Everything is client-sided, so no one will steal your config :)
`;

const DEFAULT_JSON = `[
    "Your config as JSON will appear here",
    "And from JSON we will be able to generate the new YAML config"
]
`;

export default function BreweryParser() {
    const [config, setConfig] = useState<string | null>();

    function onEditorChange(value: string | undefined) {
        try {
            const parsed = parseConfig(value || "");
            setConfig(JSON.stringify(parsed, null, 4));
        } catch (error) {
            console.error(error);
            setConfig("Invalid config");
        }
    }

    return (
        <div className="flex h-[calc(100vh-var(--navbar-height))]">
            <Editor
                theme="vs-dark"
                onChange={onEditorChange}
                height=""
                width="50%"
                defaultLanguage="yaml"
                defaultValue={DEFAULT_YAML}
            />
            <Editor
                theme="vs-dark"
                height=""
                value={config || ""}
                width="50%"
                options={{ readOnly: true }}
                defaultLanguage="json"
                defaultValue={DEFAULT_JSON}
            />
        </div>
    );
}
