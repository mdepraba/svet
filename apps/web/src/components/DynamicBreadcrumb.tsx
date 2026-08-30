import { Link, useMatches } from '@tanstack/react-router';
import { Fragment } from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './ui/breadcrumb';

export function DynamicBreadcrumb() {
  const matches = useMatches();
  const breadcrumbMatches = matches.filter(
    (match) =>
      match.routeId !== '__root__' &&
      match.routeId !== '/' &&
      match.staticData?.breadcrumbTitle,
  );

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          {breadcrumbMatches.length === 0 ||
          breadcrumbMatches[0]?.routeId === '/' ? (
            <BreadcrumbPage>Dashboard</BreadcrumbPage>
          ) : (
            <BreadcrumbLink asChild>
              <Link to="/">Dashboard</Link>
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>

        {breadcrumbMatches.length > 0 &&
          breadcrumbMatches[0]?.routeId !== '/' && (
            <BreadcrumbSeparator className="hidden md:block" />
          )}

        {breadcrumbMatches.map((match, index) => {
          if (match.routeId === '/') return null;

          const isLast = index === breadcrumbMatches.length - 1;
          const title =
            match.staticData?.breadcrumbTitle ||
            match.routeId.split('/').pop()?.replace(/-/g, ' ') ||
            'Unknown';

          const displayTitle = title.charAt(0).toUpperCase() + title.slice(1);

          return (
            <Fragment key={match.id}>
              <BreadcrumbItem className="hidden md:block">
                {isLast ? (
                  <BreadcrumbPage>{displayTitle}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={match.pathname}>{displayTitle}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator className="hidden md:block" />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
