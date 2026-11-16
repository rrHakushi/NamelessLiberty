"use client"

import React, { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { IconSettings } from "@tabler/icons-react"
import type { ServarrApp } from "./servarr-client"
import { ServarrSettingsMedia } from "./settings/servarr-settings-media"
import { ServarrSettingsProfiles } from "./settings/servarr-settings-profiles"
import { ServarrSettingsFormats } from "./settings/servarr-settings-formats"
import { ServarrSettingsProviders } from "./settings/servarr-settings-providers"
import {
  ServarrSettingsConfigForm,
  ServarrSettingsTags,
} from "./settings/servarr-settings-general"

export interface ServarrSettingsShellProps {
  app: ServarrApp
  compact?: boolean
}

/**
 * Complete 1:1 Settings Console (excluding Connect/Notifications and Advanced Mode toggle).
 */
export function ServarrSettingsShell({
  app,
  compact = false,
}: ServarrSettingsShellProps) {
  const [tab, setTab] = useState("media")

  return (
    <div className={compact ? "space-y-4" : "space-y-6 p-4 sm:p-6"}>
      {!compact && (
        <div className="flex items-center gap-2.5 text-start">
          <IconSettings className="size-6 text-zinc-300" />
          <div>
            <h1 className="text-xl font-bold text-zinc-100">
              {app === "radarr" ? "Radarr Settings" : "Sonarr v5 Settings"}
            </h1>
            <p className="text-xs text-zinc-400">
              Media management, profiles, custom formats, indexers, download
              clients, import lists & instance settings
            </p>
          </div>
        </div>
      )}

      <Tabs
        selectedKey={tab}
        onSelectionChange={(k) => setTab(String(k))}
      >
        <TabsList className="flex h-auto flex-wrap justify-start gap-1">
          <TabsTrigger id="media">Media Management</TabsTrigger>
          <TabsTrigger id="profiles">Profiles & Quality</TabsTrigger>
          <TabsTrigger id="formats">Custom Formats & Auto Tag</TabsTrigger>
          <TabsTrigger id="indexers">Indexers</TabsTrigger>
          <TabsTrigger id="clients">Download Clients</TabsTrigger>
          <TabsTrigger id="lists">Import Lists</TabsTrigger>
          <TabsTrigger id="metadata">Metadata</TabsTrigger>
          <TabsTrigger id="tags">Tags</TabsTrigger>
          <TabsTrigger id="general">General</TabsTrigger>
          <TabsTrigger id="ui">UI</TabsTrigger>
        </TabsList>

        <TabsContent id="media" className="mt-4">
          <ServarrSettingsMedia app={app} />
        </TabsContent>
        <TabsContent id="profiles" className="mt-4">
          <ServarrSettingsProfiles app={app} />
        </TabsContent>
        <TabsContent id="formats" className="mt-4">
          <ServarrSettingsFormats app={app} />
        </TabsContent>
        <TabsContent id="indexers" className="mt-4">
          <ServarrSettingsProviders app={app} kind="indexer" />
        </TabsContent>
        <TabsContent id="clients" className="mt-4">
          <ServarrSettingsProviders app={app} kind="downloadclient" />
        </TabsContent>
        <TabsContent id="lists" className="mt-4">
          <ServarrSettingsProviders app={app} kind="importlist" />
        </TabsContent>
        <TabsContent id="metadata" className="mt-4">
          <ServarrSettingsProviders app={app} kind="metadata" />
        </TabsContent>
        <TabsContent id="tags" className="mt-4">
          <ServarrSettingsTags app={app} />
        </TabsContent>
        <TabsContent id="general" className="mt-4">
          <ServarrSettingsConfigForm
            app={app}
            section="general"
            title="General Host & Security Settings"
          />
        </TabsContent>
        <TabsContent id="ui" className="mt-4">
          <ServarrSettingsConfigForm
            app={app}
            section="ui"
            title="UI Preferences"
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
