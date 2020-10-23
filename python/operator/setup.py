import os
from setuptools import setup

setup(name='openwork-board-operator-bot',
      version=os.environ.get('DDIT_VERSION', 'runtime'),
      description='OpenWork Board Operator',
      author='Digital Asset',
      author_email='community@digitalasset.com',
      url='https://opensaasame.org/',
      license='Apache2',
      install_requires=['dazl'],
      packages=['bot'],
      include_package_data=True)
