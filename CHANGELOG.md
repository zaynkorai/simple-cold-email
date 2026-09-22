# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-09-22

### Added
- **Audience Management**: Complete contact list management with tag-based segmentation and email deduplication.
- **Dispatch Engine**: Email composer supporting targeted dispatch by tag, individual recipient, or entire audience.
- **Resend Integration**: Official Resend API integration with production delivery and fallback simulation mode.
- **Audit Logging**: Detailed delivery logs with message IDs, timestamps, recipient summaries, and failure status tracking.
- **Authentication**: Lightweight session cookie authentication with configurable credentials.
- **Docker Support**: Multi-stage production `Dockerfile` with minimal Alpine image footprint.
- **Developer Experience**: TypeScript strict mode, Tailwind CSS v4 styling, automated GitHub Actions CI pipeline, and comprehensive API documentation.
