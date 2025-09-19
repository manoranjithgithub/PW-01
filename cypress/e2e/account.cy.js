describe('Account Settings Form', () => {
  beforeEach(() => {
    cy.visit('http://localhost:4200/create-deployment');
  });

  it('should display validation errors when submitting an empty form', () => {
    cy.get('form').submit();
    cy.get('input[name="name"]').parent().should('contain', 'This field is required');
    cy.get('input[name="email"]').parent().should('contain', 'This field is required');
    cy.get('input[name="username"]').parent().should('contain', 'This field is required');
    cy.get('input[name="avatar"]').parent().should('contain', 'This field is required');
  });

  it('should allow user to fill and submit the form successfully', () => {
    cy.get('input[name="name"]').type('John Doe');
    cy.get('input[name="email"]').type('john.doe@example.com');
    cy.get('input[name="username"]').type('johndoe');
    cy.get('input[name="avatar"]').type('https://example.com/avatar.jpg');

    cy.get('form').submit();
    cy.get('.success-message').should('contain', 'Account updated successfully');
  });

  it('should show error if email format is invalid', () => {
    cy.get('input[name="email"]').type('invalid-email');
    cy.get('form').submit();
    cy.get('input[name="email"]').parent().should('contain', 'Invalid email address');
  });
});
