## Authentication API: /auth

| COMPONENTS | ENDPOINTS | METHODS | ROLES |
| --------------- | --------------- | --------------- | --------------- |
| Auth login | / | POST | Open |
| Auth logout | /logout | POST | Open |


## App API: /api

| COMPONENTS | ENDPOINTS | METHODS | ROLES ACCESS | OTHER ACCESS |
| --------------- | --------------- | --------------- | --------------- | --------------- |
| Company  | /companies | POST, GET | Super | --------------- |
| \_ | /companies/:comp_id | GET | Admin, User | Company account |
| \_| /companies/:comp_id | PATCH, DELETE | Admin | Company account |
| User (by company) | /companies/:comp_id/users | POST, GET | Admin | Company account |
| User | /users | GET | Super | --------------- |
| \_ | /users/:user_id | GET, PATCH | Admin | Account owner |
| \_ | /users/:user_id | DELETE | Admin | --------------- |
| Site (by company) | /companies/:comp_id/sites | POST | Admin | Company account |
| \_ | /companies/:comp_id/sites | GET | Admin, User | Company account |
| Site | /sites | GET | Super | --------------- |
| \_ | /sites/:site_id | GET | Admin, User | Site owner |
| \_ | /sites/:site_id | PATCH, DELETE | Admin | Site owner |
| Device (by company) | /companies/:comp_id/devices | GET | Admin | Company account |
| Device (by site) | /sites/:site_id/devices | POST | Admin | Site owner |
| \_ | /sites/:site_id/devices | GET | Admin, User | Site owner |
| Device | /devices | GET | Super | --------------- |
| \_ | /devices/:d_id | GET | Admin, User | Device owner |
| \_ | /devices/:d_id | PATCH, DELETE | Admin | Device owner |
| Device Relay (by device) | /devices/:d_id/relays | POST, GET, DELETE | Admin, User | Device owner |
| \_ | /devices/:d_id/relays/add | POST | Admin, User | Device owner |
| \_ | /devices/:d_id/relays/control | POST | Admin, User | Device owner |
| Device Relay | /devices/:d_id/relays/:dr_id | GET, PATCH, DELETE | Admin, User | Device owner |
| Device Relay Schedule (by device relay) | /devices/:d_id/relays/:dr_id/schedules | POST, GET | Admin, User | Device owner |
| Device Relay Schedule | /devices/:d_id/relays/:dr_id/schedules/:drs_id | GET, PATCH, DELETE | Admin, User | Device owner |
| Device Monitor Param (by device) | /devices/:d_id/params/monitor | POST, GET | Admin, User | Device owner |
| Device Monitor Param | /devices/:d_id/params/monitor/:dmp_id | GET, PATCH, DELETE | Admin, User | Device owner |
| Device Control Param (by device) | /devices/:d_id/params/control | POST, GET | Admin, User | Device owner |
| Device Control Param | /devices/:d_id/params/control/:dcp_id | GET, PATCH, DELETE | Admin, User | Device owner |


