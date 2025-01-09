const BadRequestError = require("../error/bad_request_error");

const userPrivilege = (req, res, next) => {
    const privilege = req.session?.privilege;
    if(!privilege){   
        return next(new BadRequestError("Privilege must be provided"));
    }
    
    const allowedRoutes = {       
        "admin": [
            "/measures/retreive_measures",
            "/users/retreive_users",
            "/users/create_user",
            "/users/update_user/:id",
            "/users/delete_user/:id",
        ],
        'employee': [
            "/measures/submit_measure"
        ]
    };
    const currentRoute = req.path;
    const allowedRoutesForUser = allowedRoutes[privilege];
    
    let routeAllowed = false;
    for (const allowedRoute of allowedRoutesForUser) {
        if (allowedRoute.includes(':')) {
            const routePrefix = allowedRoute.split(':')[0];
            if (currentRoute.startsWith(routePrefix)) {
                routeAllowed = true;
                break;
            }
        } else {
            if (allowedRoute === currentRoute) {
                routeAllowed = true;
                break;
            }
        }
    }

    if (routeAllowed) {
        next();
    } else {
        const error = new Error('Forbidden');
        error.status = 403;
        next(error);
    }
}

module.exports = userPrivilege;