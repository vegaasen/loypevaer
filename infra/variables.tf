variable "aws_region" {
  description = "Primary AWS region (where the S3 bucket lives)"
  type        = string
  default     = "eu-north-1"
}

variable "domain_name" {
  description = "Root domain name (e.g. løypevær.com)"
  type        = string
  default     = "løypevær.com"
}

variable "s3_bucket_name" {
  description = "Name of the S3 bucket used for site hosting"
  type        = string
  default     = "løypevær-no-site"
}

variable "cloudfront_price_class" {
  description = "CloudFront price class - PriceClass_100 covers EU + North America (cheapest)"
  type        = string
  default     = "PriceClass_100"
}
