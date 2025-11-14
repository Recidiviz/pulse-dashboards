# https://corrections.utah.gov/probation-and-parole/community-correctional-centers/
DISALLOWED_RESOURCE_NAMES = {
    name.lower()
    for name in {
        "Atherton Community Treatment Center",
        "Atherton Community Correctional Centers",
        "Bonneville Community Correctional Center",
        "Bonneville Correctional Center",
        "Central Utah Correctional Facility",
        "Fortitude Treatment Center",
        "Northern Utah Community Correctional Center (NUCCC)",
        "Orange Street Community Correctional Center",
        "Timpanogos Community Treatment Center",
        "Utah State Correctional Facility",
    }
}


DISALLOWED_RESOURCE_ADDRESSES = {
    address.lower()
    for address in {
        ### Utah Community Correctional Centers
        "80 S. Orange Street, Salt Lake City, UT",
        "80 South Orange Street, Salt Lake City, UT",
        "255 E. 300 North, Gunnison, UT",
        "255 East 300 North, Gunnison, UT",
        "748 N 1340 W, Orem, UT",
        "748 North 1340 W, Orem, UT",
        "1141 S. 2475 West, Salt Lake City, UT",
        "1141 South 2475 West, Salt Lake City, UT",
        "1480 N 8000 W, Salt Lake City, UT",
        "1480 North 8000 West, Salt Lake City, UT",
        "1480 North 8000 West, Salt Lake City, Utah",
        "1747 S. 900 West, Salt Lake City, UT",
        "1747 South 900 West, Salt Lake City, UT",
        "2445 S. Water Tower Way, Ogden, UT",
        "2445 South Water Tower Way, Ogden, UT",
        "2588 W. 2365 South, West Valley City, UT",
        "2588 West 2365 South, West Valley City, UT",
    }
}
