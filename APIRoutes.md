## NovaAPI V2 **[INTERNAL VERSION]**
### Coming by November 18th, 2025.
##### For sure, not just maybe. DevTeam should be able to do it before then and QA Test it.
##### For security reasons private APIs or priviledged APIs use a name rather than an endpoint. Exact Details have also been removed such as Headers, Body, and HTTP Method.

BASE: https://serverops.nirmini.dev/api (CF Tunnel)

## Dashboard
> - /getgconfig | HTTP GET | Body:{Guild:<guildid>} | Headers: x-api-key: <api_tkn>
> - /setgconfig | HTTP POST | Body:{Guild:<guildid>} Headers: x-api-key: <api_tkn>
## Status
> - /getshards | HTTP GET | Body: {\*Shard:<shardid>\*} | Headers: x-api-key: <api_tkn>
> - /getapp      | HTTP GET | Body: {null}                                  | Headers: x-token: <api_tkn> | Open
## Users
> - /getusrdata | HTTP GET   | Body: {User: <userid>,\*Key: <key>\*} | Headers: x-api-key: <api_tkn>
> - /setusrdata | HTTP POST | Body: {User: <userid>, Key: <key>, Val: <value> } | Headers: x-api-key: <api_tkn>
> - /getusrsubs | HTTP GET    | Body: {User: <userid>} | Headers: x-api-key: <api_tkn>
> - /setusrsubs | HTTP POST | Body: {User: <userid>,\*Guild: <guildid>\*} | Headers: x-api-key: <api_tkn>
> - /getusrbdy | HTTP GET     | Body: {User: <userid>} | Headers: x-api-key: <api_tkn>
> - /setusrbdy | HTTP POST  | Body: {User: <userid>, Day: <24hUTC>} | Headers: x-api-key: <api_tkn>
> - /usercount  | HTTP GET    | Body: {null} | Headers: x-api-key: <api_tkn>
## Servers
> - /getguildconfig | HTTP GET    | Body: {Guild: <guildid>} | Headers: x-api-key: <api_tkn>
> - /setguildconfig | HTTP POST | Body: {Guild: <guildid>, Key: <k>, Val: <v>} | Headers: x-api-key: <api_tkn>
> - /delguildconfig | HTTP POST | Body: {Guild: <guildid>, AC: <ac>, Auth:<MFAC>} | Headers: x-api-key: <api_tkn>
> - /getguilddata    | HTTP GET    | Body: {Guild: <guildid>} | Headers: x-api-key: <api_tkn>
> - /setguilddata    | HTTP POST | Body: {Guild: <guildid>, Key: <k>, Val: <v>} | Headers: x-api-key: <api_tkn>
> - /delguilddata    | HTTP POST | Body: {Guild: <guildid>, AC: <ac>, Auth:<MFAC>} | Headers: x-api-key: <api_tkn>
> - /getguildsubs    | HTTP GET    | Body: {Guild: <guildid>} | Headers: x-api-key: <api_tkn>
> - /guildcount        | HTTP GET    | Body: {null} | Headers: x-token: <api_tkn> | Open
## Auth/Msg
> - /login                  | HTTP POST | Body: {null} | Headers: x-api-key: <api_tkn>
> - /onboarding     | HTTP POST | Body: {null} | Headers: x-api-key: <api_tkn>
> - /invite                | HTTP POST | Body: {null} | Headers: x-api-key: <api_tkn>
> - /mfa                   | HTTP POST | Body: {null} | Headers: x-api-key: <api_tkn>
> - /email                | HTTP POST | Body: {null} | Headers: x-api-key: <api_tkn>
