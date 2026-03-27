function checkAdminLogin() {
    const firstName = document.getElementById('firstName')?.value.toLowerCase();
    const lastName = document.getElementById('lastName')?.value.toLowerCase();
    const password = document.getElementById('password')?.value;

    if (firstName === 'admin' && lastName === 'admin' && password === 'Referee33**') {
        sessionStorage.setItem('role', 'admin');
        sessionStorage.setItem('adminLoggedIn', 'true');
        return true;
    }
    return false;
}
