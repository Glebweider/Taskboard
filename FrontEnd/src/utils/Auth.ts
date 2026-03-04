const AuthFunc = async () => {
    try {
        const res = await fetch(`${process.env.REACT_APP_BACKEND_URI}/auth/check`, {
            credentials: 'include',
        });

        if (res.ok) {
            window.location.href = '/projects';
        } else {
            window.location.href = process.env.REACT_APP_DISCORD_AUTH_URI || '';
        }
    } catch (err) {
        console.error('Auth check failed:', err);
        window.location.href = process.env.REACT_APP_DISCORD_AUTH_URI || '';
    }

    return null;
};

export default AuthFunc;
