import { Button, Card, Title, AreaChart, Grid, Text } from '@tremor/react';
import { useCallback, useState } from 'react';
import { Dropdown, DropdownItem } from '@tremor/react';
import Head from 'next/head';

const ATTEMPTS = 10;

type Region = 'regional' | 'global';

export default function Page() {
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [shouldTestGlobal, setShouldTestGlobal] = useState(true);
  const [shouldTestRegional, setShouldTestRegional] = useState(true);
  const [queryCount, setQueryCount] = useState(1);
  const [dataService, setDataService] = useState('nubo');
  const [data, setData] = useState({
    regional: [],
    global: [],
  });

  const runTest = useCallback(
    async (dataService: string, type: Region, queryCount: number) => {
      try {
        const start = Date.now();
        const res = await fetch(
          `/api/${dataService}-${type}?count=${queryCount}`,
        );
        const data = await res.json();
        const end = Date.now();
        return {
          ...data,
          elapsed: end - start,
        };
      } catch (e) {
        // instead of retrying we just give up
        return null;
      }
    },
    [],
  );

  const onRunTest = useCallback(async () => {
    setIsTestRunning(true);
    setData({ regional: [], global: [] });

    for (let i = 0; i < ATTEMPTS; i++) {
      let regionalValue = null;
      let globalValue = null;

      if (shouldTestRegional) {
        regionalValue = await runTest(dataService, 'regional', queryCount);
      }

      if (shouldTestGlobal) {
        globalValue = await runTest(dataService, 'global', queryCount);
      }

      setData((data) => {
        return {
          ...data,
          regional: [...data.regional, regionalValue],
          global: [...data.global, globalValue],
        };
      });
    }

    setIsTestRunning(false);
  }, [runTest, queryCount, dataService, shouldTestGlobal, shouldTestRegional]);

  return (
    <main className="p-6 max-w-5xl flex flex-col gap-3">
      <Head>
        <title>Vercel Edge Functions + Database Latency</title>
        <meta
          name="description"
          content="Observe the latency querying different data services from varying
          compute locations."
        />
        <link rel="icon" href="/favicon.ico" />
        <meta property="og:image:url" content="/edge-data.png" />
        <meta name="twitter:image" content="/edge-data.png" />
      </Head>

      <h1 className="text-2xl font-bold">
        Vercel Edge Functions + Database Latency
      </h1>
      <p>
        Observe the latency querying different data services from varying
        compute locations. We built this playground to demonstrate different
        data access patterns and how they can impact latency through sequential
        data requests (i.e. waterfalls).
      </p>
      <p>
        Learn more about{' '}
        <a
          href="https://vercel.com/docs/concepts/functions/edge-functions"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Vercel Edge Functions
        </a>
        {' or '}
        <a
          href="https://vercel.com/templates/edge-functions"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          deploy a template
        </a>
        .
      </p>
      <form className="flex flex-col gap-5 bg-gray-100 p-5 my-5">
        <div className="flex flex-col gap-1">
          <p className="font-bold">Data service</p>
          <div className="py-1 inline-flex">
            <Dropdown
              data-testid="database-dropdown"
              className="max-w-xs"
              placeholder="Select Database"
              onValueChange={(v) => setDataService(v)}
              defaultValue="nubo"
            >
              <DropdownItem data-testid="nubo" value="nubo" text="Nubo" />
            </Dropdown>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <p className="font-bold">Location</p>
          <p className="text-gray-600 text-sm">
            Vercel Edge Functions support multiple regions. By default
            they&apos;re global, but it&apos;s possible to express a region
            preference via the <Code className="text-xs">region</Code> setting.
          </p>
          <p className="text-sm flex gap-3 flex-wrap gap-y-1">
            <label className="flex items-center gap-2 whitespace-nowrap">
              <input
                type="checkbox"
                name="region"
                value="global"
                checked={shouldTestGlobal}
                onChange={(e) => setShouldTestGlobal(e.target.checked)}
              />{' '}
              Test global function
            </label>
            <label className="flex items-center gap-2 whitespace-nowrap">
              <input
                type="checkbox"
                name="region"
                value="regional"
                checked={shouldTestRegional}
                onChange={(e) => setShouldTestRegional(e.target.checked)}
              />{' '}
              Test regional (US East) function
            </label>
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <p className="font-bold">Waterfall</p>
          <p className="text-gray-600 text-sm">
            Executing complex API routes globally can be slow when the database
            is single-region, due to having multiple roundtrips to a single
            server that&apos;s distant from the user.
          </p>
          <p className="text-sm flex gap-3 flex-wrap gap-y-1">
            <label className="flex items-center gap-2 whitespace-nowrap">
              <input
                type="radio"
                name="queries"
                value="1"
                onChange={() => setQueryCount(1)}
                checked={queryCount === 1}
              />{' '}
              Single query (no waterfall)
            </label>
            <label className="flex items-center gap-2 whitespace-nowrap">
              <input
                type="radio"
                name="queries"
                value="2"
                onChange={() => setQueryCount(2)}
                checked={queryCount === 2}
              />{' '}
              2 serial queries
            </label>
            <label className="flex items-center gap-2 whitespace-nowrap">
              <input
                type="radio"
                name="queries"
                value="5"
                onChange={() => setQueryCount(5)}
                checked={queryCount === 5}
              />{' '}
              5 serial queries
            </label>
          </p>
        </div>

        <div>
          <Button
            type="button"
            data-testid="run-test"
            onClick={onRunTest}
            loading={isTestRunning}
            disabled={dataService === ''}
          >
            Run Test
          </Button>
        </div>

        {data.regional.length || data.global.length ? (
          <Grid className="gap-5" numCols={1} numColsMd={2}>
            <Card>
              <Title>Latency distribution (processing time)</Title>
              <Text>
                This is how long it takes for the edge function to run the
                queries and return the result. Your internet connections{' '}
                <b>will not</b> influence these results.
              </Text>

              <AreaChart
                className="mt-6"
                data={new Array(ATTEMPTS).fill(0).map((_, i) => {
                  return {
                    attempt: `#${i + 1}`,
                    Regional: data.regional[i]
                      ? data.regional[i].queryDuration
                      : null,
                    Global: data.global[i]
                      ? data.global[i].queryDuration
                      : null,
                  };
                })}
                index="attempt"
                categories={['Global', 'Regional']}
                colors={['indigo', 'cyan']}
                valueFormatter={dataFormatter}
                yAxisWidth={48}
              />
            </Card>
            <Card>
              <Title>Latency distribution (end-to-end)</Title>
              <Text>
                This is the total latency from the client&apos;s perspective. It
                considers the total roundtrip between browser and edge. Your
                internet connection and location <b>will</b> influence these
                results.
              </Text>

              <AreaChart
                className="mt-6"
                data={new Array(ATTEMPTS).fill(0).map((_, i) => {
                  return {
                    attempt: `#${i + 1}`,
                    Regional: data.regional[i]
                      ? data.regional[i].elapsed
                      : null,
                    Global: data.global[i] ? data.global[i].elapsed : null,
                  };
                })}
                index="attempt"
                categories={['Global', 'Regional']}
                colors={['indigo', 'cyan']}
                valueFormatter={dataFormatter}
                yAxisWidth={48}
              />
            </Card>
          </Grid>
        ) : null}
      </form>
    </main>
  );
}

const dataFormatter = (number: number) =>
  `${Intl.NumberFormat('us').format(number).toString()}ms`;

function Code({ className = '', children }) {
  return (
    <code className={`bg-gray-200 text-sm p-1 rounded ${className}`}>
      {children}
    </code>
  );
}
