# Reference Data Modules - Test Documentation

## Overview

This directory contains comprehensive test suites for the reference data modules in the logistics CRM system.

## Test Structure

### Unit Tests (\*.spec.ts)

Unit tests focus on testing individual services and controllers in isolation, using mocked dependencies.

#### Filials Module

- **filials.service.spec.ts**: Tests for FilialsService
  - `findAll()` with pagination, search, and filters
  - `findOne()` with relations
  - `create()` success and duplicate code error
  - `update()` with various scenarios
  - `delete()` soft delete functionality
  - `toggleActive()` status toggling

- **filials.controller.spec.ts**: Tests for FilialsController
  - GET /filials - pagination, search, filtering
  - GET /filials/:id - single item retrieval
  - POST /filials - creation and validation
  - PUT /filials/:id - updates and error handling
  - DELETE /filials/:id - soft delete
  - PATCH /filials/:id/toggle - status toggle
  - Authentication and authorization

#### Vehicle Types Module

- **vehicle-types.service.spec.ts**: Tests for VehicleTypesService
  - Same coverage as FilialsService
  - Tests for default values handling
  - Search by code, name, and description

- **vehicle-types.controller.spec.ts**: Tests for VehicleTypesController
  - Same coverage as FilialsController
  - Validation of numeric fields

### End-to-End Tests (\*.e2e-spec.ts)

E2E tests validate the complete application flow with real database and HTTP requests.

#### Filials Module

- **filials.e2e-spec.ts**: Full CRUD workflow
  - Authentication requirement (401 without token)
  - Search functionality
  - Pagination
  - Create with duplicate handling
  - Update with validation
  - Soft delete
  - Toggle active status

#### Vehicle Types Module

- **vehicle-types.e2e-spec.ts**: Full CRUD workflow
  - Same coverage as Filials e2e tests
  - Tests specific to vehicle type fields

## Running Tests

### Unit Tests

```bash
# Run all unit tests
npm test

# Run with coverage
npm run test:cov

# Run in watch mode
npm run test:watch
```

### End-to-End Tests

```bash
# Run all e2e tests
npm run test:e2e

# Run specific e2e test
npm run test:e2e -- --testPathPattern=filials.e2e-spec
```

## Test Configuration

- **jest-e2e.json**: Configuration for end-to-end tests
- Tests run against the actual database with test data
- Authentication is handled using JWT tokens
- Test data is cleaned up after each test

## Mock Strategy

### Services

Services are mocked using `jest.Mocked<PrismaService>` to isolate business logic from database operations.

### Controllers

Controllers are tested with:

- Service layer mocked
- Guards overridden to allow all requests
- Global validation pipe enabled

### E2E Tests

E2E tests use:

- Real application instance
- Real database (test database)
- Real JWT authentication
- supertest for HTTP requests

## Coverage Goals

- **Unit Tests**: Focus on service methods and controller endpoints
- **E2E Tests**: Focus on integration and real-world usage
- Both test suites complement each other for comprehensive coverage

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Use `afterAll` or `afterEach` to clean up test data
3. **Descriptive Names**: Use clear test and describe block names
4. **Single Responsibility**: Each test should verify one behavior
5. **Realistic Data**: Use data that resembles production data

## Dependencies

Required for testing:

- `@nestjs/testing`
- `jest`
- `ts-jest`
- `supertest`
- `@types/supertest`

## Notes

- E2E tests require a running database (test environment)
- Authentication tokens are generated using the JWT service
- Test data uses unique codes/timestamps to avoid conflicts
- All e2e tests clean up after themselves
