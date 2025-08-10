#!/bin/bash

# Generate missing testimonial images
curl -s "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=happy%20customer%20testimonial%20portrait%20smiling%20person%20restaurant&image_size=portrait_4_3" -o public/images/testimonial-3.jpg

# Generate missing volunteer images
curl -s "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=volunteer%20testimonial%20happy%20person%20community%20service%20portrait&image_size=portrait_4_3" -o public/images/volunteer-testimonial-1.jpg
curl -s "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=volunteer%20testimonial%20smiling%20person%20helping%20community%20portrait&image_size=portrait_4_3" -o public/images/volunteer-testimonial-2.jpg
curl -s "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=volunteer%20testimonial%20happy%20volunteer%20community%20work%20portrait&image_size=portrait_4_3" -o public/images/volunteer-testimonial-3.jpg
curl -s "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=volunteer%20testimonial%20grateful%20person%20community%20service%20portrait&image_size=portrait_4_3" -o public/images/volunteer-testimonial-4.jpg

# Generate missing shop merchandise images
curl -s "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=insulated%20tumbler%20coffee%20cup%20restaurant%20logo%20merchandise&image_size=square_hd" -o public/images/shop/insulated-tumbler.jpg
curl -s "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=insulated%20tumbler%20back%20view%20restaurant%20logo%20merchandise&image_size=square_hd" -o public/images/shop/insulated-tumbler-2.jpg
curl -s "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=ceramic%20coffee%20mug%20restaurant%20logo%20merchandise&image_size=square_hd" -o public/images/shop/ceramic-mug.jpg
curl -s "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=ceramic%20coffee%20mug%20side%20view%20restaurant%20logo&image_size=square_hd" -o public/images/shop/ceramic-mug-2.jpg
curl -s "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=tote%20bag%20canvas%20restaurant%20logo%20merchandise&image_size=square_hd" -o public/images/shop/tote-bag.jpg
curl -s "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=tote%20bag%20back%20view%20restaurant%20logo%20merchandise&image_size=square_hd" -o public/images/shop/tote-bag-2.jpg
curl -s "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=phone%20case%20smartphone%20restaurant%20logo%20merchandise&image_size=square_hd" -o public/images/shop/phone-case.jpg
curl -s "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=phone%20case%20back%20view%20restaurant%20logo%20merchandise&image_size=square_hd" -o public/images/shop/phone-case-2.jpg
curl -s "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=kitchen%20apron%20cooking%20restaurant%20logo%20merchandise&image_size=square_hd" -o public/images/shop/apron.jpg
curl -s "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=kitchen%20apron%20back%20view%20restaurant%20logo%20merchandise&image_size=square_hd" -o public/images/shop/apron-2.jpg
curl -s "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=wooden%20cutting%20board%20kitchen%20restaurant%20logo%20merchandise&image_size=square_hd" -o public/images/shop/cutting-board.jpg
curl -s "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=wooden%20cutting%20board%20back%20view%20restaurant%20logo&image_size=square_hd" -o public/images/shop/cutting-board-2.jpg
curl -s "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=long%20sleeve%20t%20shirt%20restaurant%20logo%20merchandise&image_size=square_hd" -o public/images/shop/long-sleeve-tee.jpg
curl -s "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=long%20sleeve%20t%20shirt%20back%20view%20restaurant%20logo&image_size=square_hd" -o public/images/shop/long-sleeve-tee-2.jpg
curl -s "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=dad%20hat%20baseball%20cap%20restaurant%20logo%20merchandise&image_size=square_hd" -o public/images/shop/dad-hat.jpg
curl -s "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=dad%20hat%20side%20view%20restaurant%20logo%20merchandise&image_size=square_hd" -o public/images/shop/dad-hat-2.jpg

# Generate missing loyalty exclusive menu image
curl -s "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=exclusive%20menu%20items%20premium%20dishes%20fine%20dining%20restaurant&image_size=landscape_16_9" -o public/images/loyalty-exclusive-menu.jpg

echo "Additional image generation complete!"