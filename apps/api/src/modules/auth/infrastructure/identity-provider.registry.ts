import { UnknownIdentityProviderError } from '../services/auth.errors';
import type {
  IdentityProviderPort,
  IdentityProviderRegistryPort,
} from './identity-provider.port';

/**
 * Looks a provider up by the name that appears in the URL.
 *
 * `null` entries are tolerated so the composition root can write
 * `config.google ? new GoogleIdentityProvider(...) : null` and have an
 * environment with no credentials simply not offer that provider, rather than
 * offering one that fails at the token endpoint.
 */
export class IdentityProviderRegistry implements IdentityProviderRegistryPort {
  private readonly byName: Map<string, IdentityProviderPort>;

  constructor(providers: ReadonlyArray<IdentityProviderPort | null>) {
    this.byName = new Map(
      providers
        .filter((provider): provider is IdentityProviderPort => provider !== null)
        .map((provider) => [provider.name.toLowerCase(), provider]),
    );
  }

  get(name: string): IdentityProviderPort {
    const provider = this.byName.get(name.trim().toLowerCase());

    if (!provider) throw new UnknownIdentityProviderError(name);

    return provider;
  }

  names(): string[] {
    return [...this.byName.keys()];
  }
}
