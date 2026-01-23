/**
 * Fills the login form credentials and attempts to submit the form.
 */
const fillCredentialsAndSubmit = (username: string, password: string): void => {
    const loginInput = document.querySelector(
        'input[name="login"]',
    ) as HTMLInputElement;
    const passwordInput = document.querySelector(
        'input[name="password"]',
    ) as HTMLInputElement;
    const form = document.querySelector(
        "form.oe_login_form",
    ) as HTMLFormElement;

    if (loginInput && passwordInput) {
        loginInput.value = username;
        passwordInput.value = password;

        // Dispatch input events so Odoo/React detects the change
        loginInput.dispatchEvent(new Event("input", { bubbles: true }));
        passwordInput.dispatchEvent(new Event("input", { bubbles: true }));

        if (form) {
            form.submit();
        } else {
            const submitBtn = document.querySelector(
                'button[type="submit"]',
            ) as HTMLButtonElement;
            submitBtn?.click();
        }
    }
};

/**
 * Creates a single login button anchor element.
 */
const createLoginButton = (
    label: string,
    user: string,
    pass: string,
): HTMLAnchorElement => {
    const btn = document.createElement("a");
    btn.href = "#";
    btn.className = "btn btn-primary m-1";
    btn.dataset.username = user;
    btn.dataset.password = pass;
    btn.title = `Login as ${label} user`;
    btn.textContent = label;

    btn.addEventListener("click", (e) => {
        e.preventDefault();
        fillCredentialsAndSubmit(user, pass);
    });

    return btn;
};

/**
 * Finds the Odoo login form and injects the "Login as" button group.
 * It searches for 'form.oe_login_form' automatically.
 */
const handleLoginButtons = (): void => {
    // 1. Find the target node (Login Form) directly
    const loginForm = document.querySelector("form.oe_login_form");

    // 2. Safety check: if we aren't on a login page, stop.
    if (!loginForm) return;

    // 3. Prevent duplicate injection
    if (loginForm.querySelector(".x-odoo-login-buttons")) return;

    // 4. Create the main wrapper
    const wrapper = document.createElement("div");
    wrapper.className = "form-group mb-3 text-center x-odoo-login-buttons";

    const labelDiv = document.createElement("div");
    labelDiv.className = "small mb-1";
    labelDiv.textContent = "Login as";
    wrapper.appendChild(labelDiv);

    const btnGroup = document.createElement("div");
    btnGroup.className = "btn-group-sm";

    const adminBtn = createLoginButton("Admin", "admin", "admin");
    const demoBtn = createLoginButton("Demo", "demo", "demo");
    const portalBtn = createLoginButton("Portal", "portal", "portal");

    btnGroup.appendChild(adminBtn);
    btnGroup.appendChild(demoBtn);
    btnGroup.appendChild(portalBtn);

    wrapper.appendChild(btnGroup);

    // 5. Append before the standard submit buttons
    const submitContainer = loginForm.querySelector(".field-login");
    if (submitContainer) {
        loginForm.insertBefore(wrapper, submitContainer);
    } else {
        loginForm.appendChild(wrapper);
    }
};

export { handleLoginButtons };
