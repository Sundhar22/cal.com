import Link from "next/link";
import React from "react";

import AppListCard from "@calcom/features/apps/components/AppListCard";
import CredentialActionsDropdown from "@calcom/features/apps/components/CredentialActionsDropdown";
import AdditionalCalendarSelector from "@calcom/features/calendars/AdditionalCalendarSelector";
import { CalendarSwitch } from "@calcom/features/calendars/CalendarSwitch";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import type { RouterOutputs } from "@calcom/trpc/react";
import { trpc } from "@calcom/trpc/react";
import { Alert } from "@calcom/ui/components/alert";
import { Select } from "@calcom/ui/components/form";
import { List } from "@calcom/ui/components/list";

import { SelectedCalendarsSettings } from "../SelectedCalendarsSettings";

export enum SelectedCalendarSettingsScope {
  User = "user",
  EventType = "eventType",
}

type SelectedCalendarsSettingsWebWrapperProps = {
  onChanged?: () => unknown | Promise<unknown>;
  fromOnboarding?: boolean;
  destinationCalendarId?: string;
  isPending?: boolean;
  classNames?: string;
  eventTypeId?: number;
  disabledScope?: SelectedCalendarSettingsScope;
  scope?: SelectedCalendarSettingsScope;
  setScope?: (scope: SelectedCalendarSettingsScope) => void;
  disableConnectionModification?: boolean;
};

const ConnectedCalendarList = ({
  fromOnboarding = false,
  scope,
  items,
  disableConnectionModification,
  eventTypeId,
  onChanged,
  destinationCalendarId,
  isDisabled,
}: {
  fromOnboarding?: boolean;
  scope: SelectedCalendarSettingsScope;
  items: RouterOutputs["viewer"]["calendars"]["connectedCalendars"]["connectedCalendars"];
  disableConnectionModification?: boolean;
  eventTypeId: number | null;
  onChanged?: () => unknown | Promise<unknown>;
  destinationCalendarId?: string;
  isDisabled: boolean;
}) => {
  const { t } = useLocale();
  const shouldUseEventTypeScope = scope === SelectedCalendarSettingsScope.EventType;
  return (
    <List noBorderTreatment className="p-6 pt-2">
      {items.map((connectedCalendar) => {
        if (!!connectedCalendar.calendars && connectedCalendar.calendars.length > 0) {
          return (
            <AppListCard
              key={`list-${connectedCalendar.credentialId}-${scope}`}
              shouldHighlight
              slug={connectedCalendar.integration.slug}
              title={connectedCalendar.integration.name}
              logo={connectedCalendar.integration.logo}
              description={connectedCalendar.primary?.email ?? connectedCalendar.integration.description}
              className="border-subtle mt-4 rounded-lg border"
              actions={
                <div className="flex w-32 justify-end">
                  <CredentialActionsDropdown
                    credentialId={connectedCalendar.credentialId}
                    integrationType={connectedCalendar.integration.type}
                    cacheUpdatedAt={connectedCalendar.cacheUpdatedAt}
                    onSuccess={onChanged}
                    delegationCredentialId={connectedCalendar.delegationCredentialId}
                    disableConnectionModification={disableConnectionModification}
                  />
                </div>
              }>
              <div className="border-subtle border-t">
                {!fromOnboarding && (
                  <>
                    <p className="text-subtle px-5 pt-4 text-sm">{t("toggle_calendars_conflict")}</p>
                    <ul className="space-y-4 px-5 py-4">
                      {connectedCalendar.calendars?.map((cal) => (
                        <CalendarSwitch
                          disabled={isDisabled}
                          key={cal.externalId}
                          externalId={cal.externalId}
                          title={cal.name || "Nameless calendar"}
                          name={cal.name || "Nameless calendar"}
                          type={connectedCalendar.integration.type}
                          isChecked={cal.isSelected}
                          destination={cal.externalId === destinationCalendarId}
                          credentialId={cal.credentialId}
                          eventTypeId={shouldUseEventTypeScope ? eventTypeId : null}
                          delegationCredentialId={connectedCalendar.delegationCredentialId || null}
                        />
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </AppListCard>
          );
        }
        return (
          <Alert
            key={`alert-${connectedCalendar.credentialId}`}
            severity="warning"
            title={t("something_went_wrong")}
            message={
              <span>
                <Link href={`/apps/${connectedCalendar.integration.slug}`}>
                  {connectedCalendar.integration.name}
                </Link>
                : {t("calendar_error")}
              </span>
            }
            iconClassName="h-10 w-10 ml-2 mr-1 mt-0.5"
            actions={
              <div className="flex w-32 justify-end">
                <CredentialActionsDropdown
                  credentialId={connectedCalendar.credentialId}
                  integrationType={connectedCalendar.integration.type}
                  cacheUpdatedAt={connectedCalendar.cacheUpdatedAt}
                  onSuccess={onChanged}
                  delegationCredentialId={connectedCalendar.delegationCredentialId}
                  disableConnectionModification={disableConnectionModification}
                />
              </div>
            }
          />
        );
      })}
    </List>
  );
};

export const SelectedCalendarsSettingsWebWrapper = (props: SelectedCalendarsSettingsWebWrapperProps) => {
  const {
    scope = SelectedCalendarSettingsScope.User,
    setScope = () => {
      return;
    },
    disabledScope,
    disableConnectionModification,
    eventTypeId = null,
  } = props;

  const query = trpc.viewer.calendars.connectedCalendars.useQuery(
    {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      eventTypeId: scope === SelectedCalendarSettingsScope.EventType ? eventTypeId! : null,
    },
    {
      suspense: true,
      refetchOnWindowFocus: false,
    }
  );

  const { isPending } = props;
  const showScopeSelector = !!props.eventTypeId;
  const isDisabled = disabledScope ? disabledScope === scope : false;
  const shouldDisableConnectionModification = isDisabled || disableConnectionModification;
  return (
    <div>
      <SelectedCalendarsSettings classNames={props.classNames}>
        <SelectedCalendarsSettingsHeading
          isConnectedCalendarsPresent={!!query.data?.connectedCalendars.length}
          isPending={isPending}
          showScopeSelector={showScopeSelector}
          setScope={setScope}
          scope={scope}
          shouldDisableConnectionModification={shouldDisableConnectionModification}
        />
        {query.data?.connectedCalendars && query.data?.connectedCalendars.length > 0 ? (
          <ConnectedCalendarList
            fromOnboarding={props.fromOnboarding}
            scope={scope}
            disableConnectionModification={disableConnectionModification}
            onChanged={props.onChanged}
            eventTypeId={eventTypeId}
            items={query.data.connectedCalendars}
            isDisabled={isDisabled}
          />
        ) : null}
      </SelectedCalendarsSettings>
    </div>
  );
};

export const SelectedCalendarsSettingsWebWrapperSkeleton = () => {
  return (
    <div className="border-subtle mt-6 rounded-lg border">
      <div className="border-subtle border-b p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="bg-emphasis h-4 w-32 animate-pulse rounded-md" />
            <div className="bg-emphasis mt-2 h-4 w-48 animate-pulse rounded-md" />
          </div>
          <div className="bg-emphasis h-8 w-32 animate-pulse rounded-md" />
        </div>
      </div>
      <div className="p-6 pt-2">
        <div className="border-subtle mt-4 rounded-lg border p-4">
          <div className="flex items-center">
            <div className="bg-emphasis h-10 w-10 animate-pulse rounded-md" />
            <div className="ml-4 space-y-2">
              <div className="bg-emphasis h-4 w-32 animate-pulse rounded-md" />
              <div className="bg-emphasis h-4 w-48 animate-pulse rounded-md" />
            </div>
          </div>
          <div className="border-subtle mt-4 space-y-4 border-t pt-4">
            <div className="bg-emphasis h-4 w-64 animate-pulse rounded-md" />
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="bg-emphasis h-4 w-48 animate-pulse rounded-md" />
                  <div className="bg-emphasis h-6 w-10 animate-pulse rounded-md" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SelectedCalendarsSettingsHeading = (props: {
  isConnectedCalendarsPresent: boolean;
  isPending?: boolean;
  showScopeSelector: boolean;
  setScope: (scope: SelectedCalendarSettingsScope) => void;
  scope: SelectedCalendarSettingsScope;
  shouldDisableConnectionModification?: boolean;
}) => {
  const { t } = useLocale();
  const optionsToSwitchScope = [
    { label: "User", value: SelectedCalendarSettingsScope.User },
    { label: "Event Type", value: SelectedCalendarSettingsScope.EventType },
  ];
  const switchScopeSelectValue = optionsToSwitchScope.find((option) => option.value === props.scope);
  return (
    <div className="border-subtle border-b p-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-emphasis text-base font-semibold leading-5">{t("check_for_conflicts")}</h4>
          <p className="text-default text-sm leading-tight">{t("select_calendars")}</p>
        </div>

        {!props.shouldDisableConnectionModification && (
          <div className="flex flex-col xl:flex-row xl:space-x-5">
            {props.isConnectedCalendarsPresent && (
              <div className="flex items-center">
                <AdditionalCalendarSelector isPending={props.isPending} />
              </div>
            )}
          </div>
        )}
      </div>
      {props.showScopeSelector && (
        <div className="mt-2 flex flex-row items-center space-x-2">
          <span className="text-default text-sm">Using</span>
          <Select
            onChange={(option) => {
              if (!option) return;
              props.setScope(option.value);
            }}
            value={switchScopeSelectValue}
            options={optionsToSwitchScope}
          />
          <span className="text-default text-sm">settings</span>
        </div>
      )}
    </div>
  );
};
