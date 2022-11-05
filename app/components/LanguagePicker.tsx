import { Dropdown } from "@nextui-org/react";
import { getNativeLanguageName } from "lib/iso6391";
import { locales } from "lib/locales";
import { useRouter } from "next/router";
import React from "react";

export function LanguagePicker() {
  const router = useRouter();
  const { pathname, asPath, query } = router;
  const currentLocale = router.locale || "en";

  const setSelectedLocale = React.useCallback(
    (keys: unknown) => {
      // redirect to the same page on the new locale
      const nextLocale = Array.from(keys as Iterable<string>)[0];
      router.push({ pathname, query }, asPath, { locale: nextLocale });
    },
    [asPath, pathname, query, router]
  );

  const selectedLocales = React.useMemo(
    () => new Set([currentLocale]),
    [currentLocale]
  );

  return (
    <Dropdown>
      <Dropdown.Button flat auto size="sm" css={{ px: 5 }}>
        {currentLocale.toUpperCase()}
      </Dropdown.Button>
      <Dropdown.Menu
        aria-label="Select Language"
        selectionMode="single"
        selectedKeys={selectedLocales}
        onSelectionChange={setSelectedLocale}
      >
        {locales.map((locale) => (
          <Dropdown.Item key={locale}>
            {locale.toUpperCase()}&nbsp;|&nbsp;{getNativeLanguageName(locale)}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
}
