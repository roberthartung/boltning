USER=hartung
CALDAV_SERVER=https://cal.ibr.cs.tu-bs.de
#curl -X PROPFIND --anyauth --user $USER --header "Depth: 0" --header "Prefer: return-minimal" --header "Content-Type: application/xml; charset=utf-8" -d '<d:propfind xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav"><d:prop><c:calendar-home-set/></d:prop></d:propfind>' $CALDAV_SERVER

# curl -X PROPFIND --anyauth --user $USER --header "Depth: 0" --header "Prefer: return-minimal" --header "Content-Type: application/xml; charset=utf-8" -d '<d:propfind xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav"><d:prop><c:calendar-home-set/></d:prop></d:propfind>' $CALDAV_SERVER/caldav.php/$USER/

# Depth: 1 also returns all the calendars!
#curl -X PROPFIND --anyauth --user $USER --header "Depth: 1" --header "Prefer: return-minimal" --header "Content-Type: application/xml; charset=utf-8" -d '<d:propfind xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav"><d:prop><d:displayname /><c:getctag /></d:prop></d:propfind>' $CALDAV_SERVER/caldav.php/$USER/

# URL taken from request before!
curl -X REPORT \
  --anyauth \
  --user $USER \
  --header "Depth: 1" \
  --header "Prefer: return-minimal" \
  --header "Content-Type: application/xml; charset=utf-8" \
  -d '<c:calendar-query xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav"><d:prop><d:getetag /><c:calendar-data /></d:prop><c:filter><c:comp-filter name="VCALENDAR" /></c:filter></c:calendar-query>' $CALDAV_SERVER/caldav.php/$USER/calendar/
